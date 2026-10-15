# JARVIS MCP Learning Server

This is the first real MCP server for the BumbleBee/JARVIS project. It exposes two small tools:

- `jarvis_calculate_total(price, quantity)`: validated INR arithmetic with bounded inputs.
- `explain_mcp_basics()`: returns a beginner-friendly explanation of MCP concepts.

## Connect the JARVIS web UI to the real MCP server

This project uses a **local-first, ₹0-first** setup. The browser cannot launch a Python process or speak MCP stdio directly, so `gateway.py` provides a narrow loopback-only HTTP bridge.

1. From the repository root, install the MCP SDK once:
   ```bash
   python -m pip install -r mcp_server/requirements.txt
   ```
2. Start the bridge:
   ```bash
   python mcp_server/gateway.py
   ```
3. Keep that terminal open. The bridge prints a one-run token. Copy it into **JARVIS > System > MCP Learning Lab**.
4. Serve the web app locally from the repository root in a second terminal, for example:
   ```bash
   python -m http.server 8080
   ```
5. Open `http://127.0.0.1:8080`, go to System > MCP Learning Lab, paste the token, and choose **Connect & discover tools**. Then choose **Run real MCP calculator**.
6. Press Ctrl+C in the bridge terminal to stop it. The token changes on the next run.

The bridge is deliberately not available to a hosted web page. Use a local page served from localhost/127.0.0.1 on port 8000 or 8080. The bridge binds only to `127.0.0.1:8765`, rejects unexpected Host/Origin values, checks the one-run token, limits request size, and allow-lists two tools. The token is held only in the page's memory and is not written to localStorage.

## Personal-assistant scope

JARVIS is being built as a **personal assistant**. Do not add an employer/work profile, workforce-management or RTA tools, or workplace data to this project. New integrations should be personal, opt-in, least-privilege, and clearly disclosed in the UI.

## Safety boundaries

- The MCP server uses **stdio** transport. The separate HTTP bridge binds only to loopback and is not a public service.
- The calculator has no filesystem, phone, contacts, messaging, or network access.
- Inputs are validated and bounded.
- No API key or AI model is required to run the unit tests.
- The browser calculator remains a clearly labelled local-only demo. The separate **real MCP calculator** button uses the loopback bridge to invoke the Python server through an MCP client session.

## Run the tests

From the repository root:

```bash
python -m pip install -r mcp_server/requirements.txt
python -m unittest discover -s mcp_server -p 'test_*.py'
node scripts/smoke.mjs
```

The calculator and gateway validation tests use Python's standard library. The MCP protocol integration test uses the SDK and verifies that a real client discovers and calls both tools. The GitHub Actions workflow runs these checks.

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
