# JARVIS MCP Learning Server

This is the first real MCP server for the BumbleBee/JARVIS project. It exposes two small tools:

- `jarvis_calculate_total(price, quantity)`: validated INR arithmetic with bounded inputs.
- `explain_mcp_basics()`: returns a beginner-friendly explanation of MCP concepts.

## Safety boundaries

- Uses MCP's **stdio** transport. It does not open a public network port.
- The calculator has no filesystem, phone, contacts, messaging, or network access.
- Inputs are validated and bounded.
- No API key or AI model is required to run the unit tests.
- The in-app MCP Learning Lab is currently a local browser demonstration. It does **not** call this server yet. A compatible MCP host/client is needed for the actual protocol connection.

## Run the tests

From the repository root:

```bash
python -m unittest discover -s mcp_server -p 'test_*.py'
```

The calculator tests use only Python's standard library.

## Install the MCP SDK

Use a virtual environment where possible:

```bash
python -m venv .venv
```

Activate it, then install:

```bash
python -m pip install -r mcp_server/requirements.txt
```

On Android/Termux, the virtual-environment commands may differ depending on the installed Python package. Do not paste API keys into the terminal or commit credentials.

## Launch

From the repository root, launch with:

```bash
python mcp_server/server.py
```

This process waits for an MCP-compatible host over standard input/output; launching it directly in a normal terminal may appear idle. That is expected. Do not point a public web endpoint at stdio. The next integration milestone is to configure a trusted MCP client to launch this server and invoke its tools.

## Learning path

1. Try the calculator in JARVIS > System > MCP Learning Lab.
2. Run the unit tests and inspect the validation cases.
3. Launch the server through a compatible MCP client.
4. Verify that the client discovers both tools and that invalid arguments are rejected.
5. Only after that, consider adding a model or further tools.
