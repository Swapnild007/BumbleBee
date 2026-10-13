# BumbleBee

**A personal AI companion and action system.** Inspired by Bumblebee's loyalty, courage, adaptability, and distinctive communication style, built with original branding and implementation.

BumbleBee is the new name for the JARVIS project. It should become a capable assistant that can understand requests, reason, use approved tools, remember user-approved context, and report what it actually did.

## Product principles

- **Companion, not a chatbot skin:** personality supports useful work; it never substitutes for capability.
- **Action with accountability:** distinguish suggestions, attempted actions, and confirmed outcomes.
- **User control:** explicit permission for consequential actions; visible settings for providers, privacy, and memory.
- **Replaceable intelligence:** provider integrations sit behind a common interface.
- **Useful by default:** menus open working capabilities, not decorative placeholder screens.
- **Mobile-first:** preserve the existing approved interface, menus, spacing, responsive behavior, and finalized splash when its source is available.
- **Original identity:** use a yellow/black/steel visual language and expressive motion as inspiration, without copying Transformers artwork, logos, or proprietary character assets.

## Capability areas

1. **Command** — chat, voice input/output, intent routing, tool-assisted task execution.
2. **Home** — assistant status, current context, quick actions, approved live context.
3. **Insights** — web research, analysis, source-backed answers, knowledge capture.
4. **Journey** — reminders, goals, workflows, scheduled tasks, execution history.
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

- **P0 — Foundation:** inspect and preserve the approved UI; establish configuration, provider abstraction, intent/action contracts, error handling, and secure secret handling.
- **P1 — Core assistant:** streaming conversation, voice-ready interface, skill registry, confirmation gates, execution receipts, and memory controls.
- **P2 — Useful skills:** research with sources, task/reminder workflows, file assistance, and official media integrations.
- **P3 — Reliability:** automated tests, retries with limits, audit history, accessibility, mobile checks, and deployment checks.

## Non-negotiable safety and reliability rules

- Never claim an action succeeded unless the connected tool confirms success.
- Never put API keys or tokens in client-side code or commit them to the repository.
- Ask before sending messages, deleting data, making purchases, or taking other consequential actions.
- Keep conversation context, personal memory, and external knowledge distinct.
- Clearly label demo/mock data and unavailable integrations.
- Prefer official APIs and supported playback handoffs over scraping or unauthorized extraction.

## Current repository status

This repository was initially empty. This README defines the product direction and build contract. The existing approved UI/splash source must be brought into this repository or supplied before implementation can safely claim to preserve it exactly.
