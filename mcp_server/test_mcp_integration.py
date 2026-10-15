"""End-to-end tests for the actual MCP stdio server.

These tests run in CI after installing mcp_server/requirements.txt. They do not
require a model, API key, public network listener, or access to personal data.
"""
import asyncio
import json
import unittest

try:
    from mcp import ClientSession, StdioServerParameters
    from mcp.client.stdio import stdio_client
    MCP_AVAILABLE = True
except ImportError:
    MCP_AVAILABLE = False


@unittest.skipUnless(MCP_AVAILABLE, "Install mcp_server/requirements.txt to run MCP protocol tests")
class MCPServerIntegrationTests(unittest.TestCase):
    async def _session(self):
        from pathlib import Path
        import sys

        server_path = Path(__file__).with_name("server.py")
        params = StdioServerParameters(command=sys.executable, args=[str(server_path)])
        return stdio_client(params)

    async def _exercise(self):
        async with await self._session() as (read_stream, write_stream):
            async with ClientSession(read_stream, write_stream) as session:
                await session.initialize()
                listed = await session.list_tools()
                names = {tool.name for tool in listed.tools}
                self.assertEqual(names, {"jarvis_calculate_total", "explain_mcp_basics"})

                result = await session.call_tool(
                    "jarvis_calculate_total",
                    {"price": 12.5, "quantity": 4},
                )
                self.assertFalse(result.isError)
                structured = getattr(result, "structuredContent", None)
                if structured is not None:
                    payload = structured
                else:
                    text_items = [item.text for item in result.content if getattr(item, "text", None)]
                    self.assertTrue(text_items, "calculator should return a readable result")
                    payload = json.loads(text_items[0])
                self.assertEqual(str(payload["total"]), "50.00")
                self.assertEqual(payload["currency"], "INR")

                lesson = await session.call_tool("explain_mcp_basics", {})
                self.assertFalse(lesson.isError)
                self.assertTrue(lesson.content)

    def test_real_mcp_client_discovers_and_calls_tools(self):
        asyncio.run(self._exercise())


if __name__ == "__main__":
    unittest.main()
