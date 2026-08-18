# Ownership answers (captain section 44)

Verified against Prime Agent 0.7.3 extension API and this provider's CLI spawn design.

| Concern | Owner |
|---|---|
| Main context / fleet orchestration | Firstmate (crew, dispatch, supervision, worktree lifecycle) |
| Agent session / RLM / subagents / goals | Prime Agent |
| Tool authority at model runtime | Cursor Agent CLI (Cursor tools execute inside `agent`; this provider only observes NDJSON) |
| Workspace root | Firstmate assigns the worktree; Prime Agent process cwd is that tree; this provider passes `process.cwd()` as `--workspace` |
| Model selection UI / provider registry | Prime Agent (`/model`, `prime-agent model list`); this extension registers provider id `cursor` |
| Authentication | Cursor Agent CLI (`agent login` / `CURSOR_API_KEY`); Firstmate must not store Cursor OAuth tokens |
| Process lifecycle of `agent` children | This provider (spawn, abort → SIGTERM/SIGKILL, process-group cleanup) |
| Memory / AGENTS.md / skills | Prime Agent + Firstmate project memory owners |
| Crew knowledge / learning layer | Firstmate |
| Evaluation / no-mistakes | Firstmate delivery mode |

## Deviation note

Prime Agent still owns the conversational session object and `streamSimple` contract.
Cursor owns a nested CLI session for each streamed turn.
That nested session is translation, not a second Firstmate harness.
