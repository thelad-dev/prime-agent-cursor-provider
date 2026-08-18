# prime-agent-cursor-provider

Native [Prime Agent](https://github.com/PrimeIntellect-ai/prime-agent) extension that routes model requests through the **Cursor Agent CLI** (`agent`).

This is **not** an OpenAI-compatible HTTP provider and **not** a `models.json` hack.
It registers provider id `cursor` via Prime's `pi.registerProvider({ streamSimple })` API.

Reference architecture (Pi, CLI spawn — not the OAuth/gRPC fork):
[netandreus/pi-cursor-provider](https://github.com/netandreus/pi-cursor-provider).

## Prerequisites

| Requirement | Notes |
|---|---|
| Prime Agent ≥ 0.7.3 | `prime-agent` on `PATH` |
| Cursor Agent CLI | `agent` on `PATH`, or set `CURSOR_AGENT_PATH` / `AGENT_PATH` |
| Cursor account | Models depend on your subscription |

Verified locally against `prime-agent` **0.7.3** and Cursor Agent CLI **2026.08.11-e8db854**.

## Install

```bash
# From git (SSH)
prime-agent package install git:git@github.com:thelad-dev/prime-agent-cursor-provider

# Or try once without installing
prime-agent -e /absolute/path/to/prime-agent-cursor-provider
```

## Auth

```bash
agent login
# or
export CURSOR_API_KEY=...
```

Inside Prime Agent after loading the extension:

| Command | Action |
|---|---|
| `/cursor-login` | `agent login` |
| `/cursor-status` | `agent status` |
| `/cursor-logout` | `agent logout` |

Firstmate must **not** store Cursor OAuth tokens. Auth stays with the Cursor CLI.

## Usage

```bash
prime-agent --provider cursor --model auto
prime-agent --provider cursor --model claude-opus-4-6 --thinking xhigh
```

Or `/model cursor/<id>` in the interactive UI.

## How it works

```text
Prime Agent
  → provider=cursor (this extension)
  → agent --print --output-format stream-json --model … --trust --workspace <cwd>
  → Cursor subscription models + Cursor tools
```

- **Discovery:** live `agent models` (account-dependent); static fallback if discovery fails/times out.
- **Thinking:** Prime `off|minimal|low|medium|high|xhigh|max` mapped to CLI variants that actually exist in discovery.
- **Tools:** Cursor executes tools; this provider observes NDJSON and emits informational text (no Prime re-execution loop).
- **Workspace:** `process.cwd()` (Firstmate/Prime assigned worktree).
- **Teardown:** AbortSignal terminates the child process group (SIGTERM, then SIGKILL).
- **Bounded CLI calls:** discovery, `status`, `logout`, and the interactive `login` each run under a timeout that tears the child down instead of hanging the session.

## Configuration

| Env | Purpose |
|---|---|
| `CURSOR_AGENT_PATH` | Path to `agent` binary (preferred) |
| `AGENT_PATH` | Fallback binary path |
| `CURSOR_API_KEY` | Read from the child environment by `agent`; never placed on the child command line |

## Limitations

- Image input is serialized as a textual placeholder (CLI `--print` has no image attachment API in the verified version).
- Multi-turn history is flattened into one prompt; very large Prime contexts can overflow Cursor's context window.
- Token/cost fields are left at zero unless Cursor emits usable usage in NDJSON (currently unused).
- Live end-to-end generation requires a logged-in Cursor account (`agent status`).

## Ownership

See [OWNERSHIP.md](./OWNERSHIP.md). Grill answers: [GRILL-ME.md](./GRILL-ME.md).

## Development

```bash
npm test
npm run e2e:discovery
```

## License

MIT
