# Self grill-me (captain section 45)

| Question | Answer |
|---|---|
| Cursor via CLI, not fake OpenAI? | Yes. `streamSimple` spawns `agent --print --output-format stream-json`. No `models.json`, no OpenAI HTTP. |
| Dynamic model discovery? | Yes. Factory awaits `agent models`; static list is fallback only. |
| New Cursor model appears? | Next Prime start discovers it without code change (unmapped ids pass through). |
| Model removed? | Absent from next discovery; fallback list may still show it offline until discovery succeeds again. |
| `agent models` hangs? | 15s timeout, then fallback. |
| `agent` missing? | ENOENT → clear error; discovery falls back; stream reports missing binary. |
| Missing login? | CLI stderr surfaced (redacted); no Prime crash on discovery. |
| `CURSOR_API_KEY`? | Forwarded as `--api-key` to child only; never logged (stderr redaction). |
| Worktree change / secondmates? | Uses `process.cwd()`; Firstmate launches Prime in the assigned worktree/home. |
| Abort / daemon teardown? | AbortSignal → SIGTERM + process-group kill + SIGKILL grace. |
| Tool ownership? | Cursor executes tools; we emit observational text, not `toolcall_*`, so Prime does not re-run tools. |
| Session ownership? | Prime session remains; Cursor CLI session is per-turn translation. |
| RLM / continual harness lost? | Provider only replaces the model transport; Prime RLM stays in Prime. UNVERIFIED live RLM+cursor combo without auth. |
| Context duplication / overflow? | Transcript serialized into one prompt (same class of risk as pi-cursor-provider). Large histories can overflow Cursor context — documented limitation. |
| Malformed NDJSON / unknown events? | Ignored; stream continues. |
| CLI updates? | Flags verified on 2026.08.11-e8db854; re-verify on upgrade. |
| Extra telemetry / key logging? | None added; keys redacted from surfaced stderr. |
| Firstmate without Cursor / without Prime? | Extension is optional; other providers untouched. |
| Unverified APIs? | Marked in README FINDINGS; ExtensionAPI/`registerProvider`/`streamSimple` verified from installed 0.7.3 types+docs. |
