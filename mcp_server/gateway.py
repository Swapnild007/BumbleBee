"""Loopback-only HTTP bridge between the JARVIS web UI and the local MCP server.

This is intentionally small and allow-listed. It binds only to 127.0.0.1,
requires a per-run bearer token, accepts only local development origins, and
exposes only the two educational tools in this milestone.
"""
from __future__ import annotations

import asyncio
import hmac
import json
import secrets
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

HOST = "127.0.0.1"
PORT = 8765
MAX_BODY_BYTES = 16_384
ALLOWED_ORIGINS = {
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
}
ALLOWED_HOSTS = {f"localhost:{PORT}", f"127.0.0.1:{PORT}"}
ALLOWED_TOOLS = {"jarvis_calculate_total", "explain_mcp_basics"}


def origin_allowed(origin: str | None) -> bool:
    """Only allow the local development origins used by this project."""
    return origin is None or origin in ALLOWED_ORIGINS


def host_allowed(host: str | None) -> bool:
    """Block DNS-rebinding requests using an unexpected Host header."""
    return host in ALLOWED_HOSTS


def validate_call_payload(payload: Any) -> tuple[str, dict[str, Any]]:
    """Validate a tool call before passing it to the MCP client."""
    if not isinstance(payload, dict):
        raise ValueError("Request body must be a JSON object.")
    name = payload.get("name")
    arguments = payload.get("arguments", {})
    if name not in ALLOWED_TOOLS:
        raise ValueError("That MCP tool is not enabled in this learning bridge.")
    if not isinstance(arguments, dict):
        raise ValueError("Tool arguments must be a JSON object.")
    if name == "jarvis_calculate_total":
        if set(arguments) != {"price", "quantity"}:
            raise ValueError("Calculator requires exactly price and quantity.")
        price = arguments["price"]
        quantity = arguments["quantity"]
        if isinstance(price, bool) or not isinstance(price, (int, float)):
            raise ValueError("Price must be a number.")
        if isinstance(quantity, bool) or not isinstance(quantity, int):
            raise ValueError("Quantity must be a whole number.")
        if price < 0 or price > 1_000_000_000:
            raise ValueError("Price is outside the allowed range.")
        if quantity < 0 or quantity > 1_000_000:
            raise ValueError("Quantity is outside the allowed range.")
    elif arguments:
        raise ValueError("This tool takes no arguments.")
    return name, arguments


async def _invoke_mcp(name: str, arguments: dict[str, Any]) -> dict[str, Any]:
    # Import only when invoked so validation tests can run without the SDK installed.
    from mcp import ClientSession, StdioServerParameters
    from mcp.client.stdio import stdio_client

    server_path = Path(__file__).with_name("server.py")
    params = StdioServerParameters(
        command=sys.executable,
        args=[str(server_path)],
    )
    async with stdio_client(params) as (read_stream, write_stream):
        async with ClientSession(read_stream, write_stream) as session:
            await session.initialize()
            if name == "__list_tools__":
                result = await session.list_tools()
                return {
                    "tools": [
                        {
                            "name": item.name,
                            "description": item.description or "",
                            "inputSchema": item.inputSchema,
                        }
                        for item in result.tools
                    ]
                }
            result = await session.call_tool(name, arguments)
            content = []
            for item in result.content:
                if getattr(item, "text", None) is not None:
                    content.append({"type": "text", "text": item.text})
                else:
                    content.append({"type": getattr(item, "type", "unknown")})
            return {"isError": bool(result.isError), "content": content}


def invoke_mcp(name: str, arguments: dict[str, Any]) -> dict[str, Any]:
    return asyncio.run(_invoke_mcp(name, arguments))


def make_handler(token: str):
    class Handler(BaseHTTPRequestHandler):
        server_version = "JARVISLocalMCP/1.0"

        def log_message(self, _format: str, *_args: Any) -> None:
            # Avoid writing request headers or user-provided content to logs.
            return

        def _send(self, status: int, data: dict[str, Any]) -> None:
            raw = json.dumps(data, ensure_ascii=False).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(raw)))
            self.send_header("Cache-Control", "no-store")
            origin = self.headers.get("Origin")
            if origin in ALLOWED_ORIGINS:
                self.send_header("Access-Control-Allow-Origin", origin)
                self.send_header("Vary", "Origin")
            self.end_headers()
            self.wfile.write(raw)

        def _authorized(self) -> bool:
            supplied = self.headers.get("X-JARVIS-Token", "")
            if not hmac.compare_digest(supplied, token):
                self._send(401, {"ok": False, "error": "Invalid or missing local bridge token."})
                return False
            return True

        def _preflight(self) -> None:
            origin = self.headers.get("Origin")
            if not origin_allowed(origin) or not host_allowed(self.headers.get("Host")):
                self._send(403, {"ok": False, "error": "Origin or Host is not allowed."})
                return
            self.send_response(204)
            self.send_header("Access-Control-Allow-Origin", origin or "null")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, X-JARVIS-Token")
            self.send_header("Access-Control-Max-Age", "300")
            self.send_header("Vary", "Origin")
            self.end_headers()

        def do_OPTIONS(self) -> None:
            self._preflight()

        def do_GET(self) -> None:
            if not host_allowed(self.headers.get("Host")) or not origin_allowed(self.headers.get("Origin")):
                self._send(403, {"ok": False, "error": "Origin or Host is not allowed."})
                return
            if not self._authorized():
                return
            path = urlparse(self.path).path
            if path == "/health":
                self._send(200, {"ok": True, "service": "JARVIS local MCP bridge"})
            elif path == "/mcp/tools":
                try:
                    self._send(200, {"ok": True, **invoke_mcp("__list_tools__", {})})
                except Exception:
                    self._send(502, {"ok": False, "error": "Could not start the local MCP server. Check setup instructions."})
            else:
                self._send(404, {"ok": False, "error": "Not found."})

        def do_POST(self) -> None:
            if not host_allowed(self.headers.get("Host")) or not origin_allowed(self.headers.get("Origin")):
                self._send(403, {"ok": False, "error": "Origin or Host is not allowed."})
                return
            if not self._authorized():
                return
            if urlparse(self.path).path != "/mcp/call":
                self._send(404, {"ok": False, "error": "Not found."})
                return
            try:
                length = int(self.headers.get("Content-Length", "0"))
                if length <= 0 or length > MAX_BODY_BYTES:
                    raise ValueError("Request body must be between 1 byte and 16 KB.")
                payload = json.loads(self.rfile.read(length).decode("utf-8"))
                name, arguments = validate_call_payload(payload)
                self._send(200, {"ok": True, **invoke_mcp(name, arguments)})
            except (ValueError, UnicodeDecodeError, json.JSONDecodeError) as exc:
                self._send(400, {"ok": False, "error": str(exc)})
            except Exception:
                self._send(502, {"ok": False, "error": "MCP tool call failed. Check the local setup and tool output."})

    return Handler


def main() -> None:
    token = secrets.token_urlsafe(32)
    server = ThreadingHTTPServer((HOST, PORT), make_handler(token))
    print("JARVIS local MCP bridge started on http://127.0.0.1:8765")
    print("Copy this one-run token into JARVIS > System > MCP Learning Lab:")
    print(token, flush=True)
    print("Press Ctrl+C to stop. The bridge is loopback-only and exposes two allow-listed tools.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping JARVIS local MCP bridge.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
