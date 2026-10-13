# BumbleBee Architecture Contract

## Request lifecycle

1. Capture user input (text first; voice can use the same request contract).
2. Classify intent and identify the required skill.
3. Build a typed action plan with required inputs and risk level.
4. Check permissions and request confirmation when the action is consequential.
5. Execute through a registered skill adapter.
6. Return a result with status, evidence, and any follow-up required.
7. Append a sanitized audit event; persist only memory the user has allowed.

## Action result contract

Every tool-backed action should resolve to one of these states:

- `proposed`: plan prepared, not executed.
- `awaiting_confirmation`: user approval is required.
- `running`: execution started.
- `succeeded`: tool returned a verifiable success result.
- `failed`: tool returned an error.
- `partially_succeeded`: some steps completed, others did not.
- `cancelled`: user or system cancelled the operation.

A conversational acknowledgement is not proof of execution.

## Core interfaces

### Provider adapter

A provider adapter should expose a consistent interface for streaming responses, cancellation, model metadata, and structured tool calls. Credentials are server-side environment secrets. Provider choice is configuration, not UI-specific business logic.

### Skill registry

Each skill declares:
- stable ID and version
- human-readable description
- input/output schema
- required permissions
- risk class
- timeout and retry policy
- execution handler
- tests and health state

Skills must not bypass the permission gate.

### Memory domains

- **Conversation state:** short-lived context needed to answer the current thread.
- **Personal memory:** explicit user-approved preferences and durable facts; inspectable and deletable.
- **Knowledge/research:** sourced external information with URLs and retrieval timestamps.
- **Execution history:** action receipts and status; secrets and unnecessary sensitive payloads are excluded.

## Initial skill candidates

1. Conversation and clarification
2. Web research with source references
3. Reminder/task creation
4. File analysis
5. Approved media search and official playback handoff
6. User-approved memory read/write/delete
7. Provider and diagnostic status

## Security and reliability

- Validate all inputs at skill boundaries.
- Keep secrets out of browser bundles, logs, screenshots, and repository history.
- Apply least-privilege access to every integration.
- Require confirmation for external side effects and destructive actions.
- Bound retries, timeouts, and tool output size.
- Make cancellation explicit where supported.
- Provide a useful offline/error state when providers or tools are unavailable.
- Test permission denials and provider failures, not only happy paths.

## UI preservation gate

Before implementing UI changes, locate the approved JARVIS UI source and compare:
- splash/intro
- navigation labels and destinations
- mobile layout and spacing
- typography, colors, and interaction states

Preserve those decisions unless the product owner explicitly approves a change. BumbleBee-inspired identity can first appear in copy, assistant personality, motion details, and a restrained visual accent system rather than a wholesale redesign.
