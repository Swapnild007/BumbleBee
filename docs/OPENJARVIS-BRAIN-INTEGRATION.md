# OpenJarvis-inspired JARVIS brain integration

## Decision

Use OpenJarvis as an architectural reference, not as a drop-in dependency. OpenJarvis is a Python framework built around pluggable intelligence/inference engines, agents, tools, memory, and trace-driven evaluation. JARVIS is currently a browser-first application with a small serverless API and a native Android bridge. Importing the Python runtime wholesale would add a separate runtime, model-serving process, dependency footprint, and deployment path before it solves the current product's gaps.

Reference: https://github.com/open-jarvis/OpenJarvis (Apache-2.0; review the upstream license and notices before copying any source).

## What has been adapted in JARVIS

- **Evaluation corpus:** `training/intents.json` remains the versioned regression dataset. `scripts/train-intents.mjs` validates expected intents, slots, and clarification behavior. This is evaluation, not model-weight training.
- **Local trace ledger:** `brain/trace-store.js` stores the latest 100 command/response traces in browser local storage. Each trace records the intent, confidence, routing source, response, outcome, and duration. The user can rate the latest response and export traces as JSON.
- **Privacy boundary:** traces are local-only by default. They are not uploaded, and user feedback does not automatically train a model.
- **Explicit correction loop:** the System panel can teach an exact phrase-to-intent correction. Corrections are bounded to 100 entries in local storage, are not generalized to similar phrases, can be deleted, and are applied before default rule routing. This is a small local routing adaptation, not model-weight training. If a corrected consequential command lacks safely parsed slots, JARVIS asks for clarification; ordinary action confirmation remains in force.
- **Safety boundary:** consequential actions still require explicit confirmation. A trace is evidence of what JARVIS attempted or replied, not proof that an external action succeeded.

## Target architecture

1. **Command understanding:** deterministic offline routing first; low-confidence or incomplete requests ask a focused clarification.
2. **Brain/agent interface:** one contract for request, context, tool proposal, final answer, and trace metadata. Keep UI components separate from reasoning.
3. **Inference adapters:** optional hosted provider behind the existing authenticated server-side AI gateway. A local OpenAI-compatible engine can be added only when there is a reachable local backend and an explicit connection/health check; never point a deployed serverless function at its own localhost and claim that it reaches the user's phone.
4. **Tools:** allowlisted tools with schemas, permission requirements, validation, and confirmation for consequential actions. Model output is a proposal, not an authorization.
5. **Memory:** explicit saved facts and searchable local notes, with source/time metadata. Do not infer memories from unanswered prompts.
6. **Traces and evaluation:** retain bounded traces, allow user feedback, evaluate held-out cases, and report accuracy/clarification/failure rates. Do not call this model training unless model weights or a real trainable policy are updated and evaluated.
7. **Learning loop:** use opt-in, privacy-reviewed traces to propose routing/prompt changes; require regression tests before promoting changes. Never auto-learn from raw personal conversations without consent.

## Release gates before calling JARVIS production-ready

- Mobile browser end-to-end suite passes on the current branch.
- All intent cases test both classification and extracted slots; incomplete and ambiguous commands trigger clarification.
- External actions have an explicit confirmation/cancel path and only report success after the platform reports success.
- AI credentials remain server-side; auth, origin checks, request limits, and error paths are tested.
- Offline behavior, storage limits, data export/deletion, stale data, and recovery are tested.
- Android bridge capabilities are tested on a real device; stubs are labeled unavailable.
- No APK is called production-ready based only on compilation or CI.

## Immediate next work

1. Finish and inspect the Playwright browser acceptance run for local trace persistence/feedback.
2. Add explicit command-plan outcome tests and make evaluation metrics visible in the brain panel.
3. Decide the first real inference runtime and deployment target before implementing a local-model adapter.
4. Continue native Android integration only after the web path is stable.
