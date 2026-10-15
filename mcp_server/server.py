"""Beginner-safe JARVIS MCP server. Uses stdio; no network listener is opened."""
from mcp.server.fastmcp import FastMCP

from calculator import calculate_total

mcp = FastMCP("jarvis-learning-tools")


@mcp.tool()
def jarvis_calculate_total(price: float, quantity: int) -> dict[str, str | int]:
    """Calculate an item total in INR. Read-only and safe; does not access files or network."""
    return calculate_total(price, quantity)


@mcp.tool()
def explain_mcp_basics() -> dict[str, str]:
    """Explain the main MCP concepts for a beginner."""
    return {
        "protocol": "Model Context Protocol",
        "client": "The AI application component that connects to an MCP server.",
        "server": "A program that exposes tools and resources through MCP.",
        "tool": "A named capability that a compatible client can ask the server to run.",
        "safety": "A tool should receive only the permissions needed for its job.",
        "next_step": "Connect this stdio server to a compatible MCP client and test its tools.",
    }


if __name__ == "__main__":
    # stdio transport is intended for a compatible MCP host to launch this process.
    mcp.run(transport="stdio")
