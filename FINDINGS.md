# Findings (2026-08-18)

## Firstmate PR #1966

`kunchenguid/firstmate#1966` ("feat(bin): add prime-agent as a verified harness adapter") is **closed and not merged**.
This Firstmate checkout's `AGENTS.md` / `bin/fm-harness.sh` do **not** list `prime` as a verified harness.
Per captain brief: do **not** invent a Firstmate Prime harness here.
Ship this standalone extension against installed Prime Agent 0.7.3; Firstmate wiring waits for a real harness merge.

## Verified APIs

| Surface | Evidence |
|---|---|
| `pi.registerProvider` / `streamSimple` / `ProviderConfig` | `prime-agent@0.7.3` `dist/core/extensions/types.d.ts` + `docs/custom-provider.md` |
| Extension package manifest `pi.extensions` | `docs/packages.md` |
| `agent --print --output-format stream-json --model --trust --workspace` | `agent --help` 2026.08.11-e8db854 |
| `agent models` / `login` / `status` / `logout` | live CLI help |
| `CURSOR_API_KEY` env var accepted in place of `--api-key` | `agent --help`: "can also use CURSOR_API_KEY env var" |
| `Api` open string for custom stream handlers | `@earendil-works/pi-ai` `types.d.ts` (`KnownApi \| (string & {})`) |

## UNVERIFIED (account-dependent)

- Exact live `agent models` inventory (this machine: not logged in).
- Live NDJSON event shape under current CLI while authenticated (parser follows pi-cursor-provider + ignores unknown types).
- Prime RLM + Cursor provider interaction under a long session.

## Live `prime-agent model list` on this host

With a private `--daemon-socket`, loading the extension still surfaced Cursor CLI auth errors when `agent` was not logged in.
Mock ExtensionAPI registration smoke (`npm run e2e:register`) confirms provider id `cursor`, custom api `cursor-agent-cli`, streamSimple, and slash commands register with the static fallback model set (18 rows) when discovery fails.
Authenticated end-to-end generation and `model list` against a logged-in Cursor account remain **UNVERIFIED** on this machine.
