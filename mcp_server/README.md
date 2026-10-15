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

## Optional: run the raw MCP server manually

For MCP-client debugging, the server can also be launched directly:

```bash
python mcp_server/server.py
```

It waits for a compatible MCP host over standard input/output, so it may appear idle in a normal terminal. For the JARVIS web UI, use `gateway.py` as described above instead.

## Learning path

1. Run the browser-only calculator and compare it with the real MCP calculator.
2. Connect the local bridge and discover the two tools.
3. Run the Python unit and MCP protocol integration tests.
4. Keep the allowlist small. Add no personal-data access or side-effecting tools until each permission and confirmation flow has a dedicated test.
