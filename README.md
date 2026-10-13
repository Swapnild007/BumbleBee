# BumbleBee

**A personal AI companion and action system.** BumbleBee replaces JARVIS, taking inspiration from the loyalty, courage, adaptability, and expressive communication associated with the Transformers character while using an original identity and implementation.

## Current build

The first mobile-first, single-file web interface is now committed at [`index.html`](./index.html).

It includes:
- Cinematic startup sequence with skip and timeout fallback
- Responsive desktop navigation and compact mobile navigation
- Home capability deck and command console
- Local-only task ledger and user-created memory notes
- Browser voice input where supported, and optional speech synthesis
- Provider preference settings and privacy controls
- Honest runtime status: no AI provider or external tools are connected yet

**Important:** this is the interface foundation, not a fully connected AI agent. The command console only handles a few explicit local status/help prompts; it clearly identifies other requests as unsupported until a reasoning provider is integrated. Provider secrets must never be placed in client-side code.

## Product principles

- **Companion, not a chatbot skin:** personality supports useful work; it never substitutes for capability.
- **Action with accountability:** distinguish suggestions, attempted actions, and confirmed outcomes.
- **User control:** explicit permission for consequential actions; visible settings for providers, privacy, and memory.
- **Replaceable intelligence:** provider integrations sit behind a common interface.
- **Useful by default:** menus open working capabilities, not decorative placeholder screens.
- **Mobile-first:** preserve approved JARVIS UI decisions wherever source is available; do not claim pixel-perfect preservation without comparing the original source.
- **Original identity:** yellow, black, and steel visual language with expressive motion, without copying Transformers artwork, logos, or proprietary character assets.

## Capability areas

1. **Command** — conversation, voice, intent routing, tool-assisted execution.
2. **Home** — assistant status, current context, quick actions.
3. **Insights** — web research, analysis, source-backed answers, knowledge capture.
4. **Journey** — reminders, goals, workflows, and execution history.
5. **Memory** — user-approved preferences and durable facts, with review and deletion controls.
6. **Settings** — model/provider configuration, privacy, permissions, voice, diagnostics.

## Target architecture

```text
Web UI / Voice
      |
Intent Router
      |
Orchestrator ---- Conversation State
      |           Personal Memory (consent-controlled)
      |           Task / Event Store
      |
Skill & Tool Registry
      |
Permission / Confirmation Gate
      |
Provider Adapter (replaceable LLMs)
      |
Tools: research, files, reminders, media, workflows
      |
Execution receipts, audit events, user-visible status
```

## Implementation sequence

- **P0 — Foundation:** preserve/compare approved UI source, secure provider gateway, provider abstraction, intent/action contracts, error handling.
- **P1 — Core assistant:** streaming conversation, voice, skill registry, confirmation gates, execution receipts, memory controls.
- **P2 — Useful skills:** research with sources, task/reminder workflows, file assistance, official media integrations.
- **P3 — Reliability:** automated tests, bounded retries, audit history, accessibility, mobile checks, deployment checks.

## Non-negotiable reliability rules

- Never claim an action succeeded unless the connected tool confirms success.
- Never put API keys or tokens in client-side code or commit them to the repository.
- Ask before sending messages, deleting data, making purchases, or taking other consequential actions.
- Keep conversation context, personal memory, and external knowledge distinct.
- Clearly label demo/mock data and unavailable integrations.
- Prefer official APIs and supported playback handoffs over unauthorized extraction.

## Architecture contract

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for request lifecycle, action states, skill interface expectations, memory domains, and security rules.
