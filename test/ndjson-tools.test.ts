import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildAgentModelsArgs,
  buildAgentPrintArgs,
} from "../lib/agent-cli.ts";
import { resolveAgentPath } from "../lib/agent-path.ts";
import { formatSpawnErrno, redactedStderr } from "../lib/errors.ts";
import { parseNdjsonLine } from "../lib/ndjson.ts";
import { toDisplayToolName } from "../lib/tools.ts";

describe("parseNdjsonLine", () => {
  it("parses assistant events", () => {
    const line = JSON.stringify({
      type: "assistant",
      message: { role: "assistant", content: [{ type: "text", text: "hi" }] },
    });
    const ev = parseNdjsonLine(line);
    assert.equal(ev?.type, "assistant");
  });

  it("returns null for malformed JSON", () => {
    assert.equal(parseNdjsonLine("{not-json"), null);
    assert.equal(parseNdjsonLine(""), null);
  });
});

describe("tool names", () => {
  it("maps known CLI keys", () => {
    assert.equal(toDisplayToolName("shellToolCall"), "Shell");
    assert.equal(toDisplayToolName("readToolCall"), "Read");
    assert.equal(toDisplayToolName("customThingToolCall"), "customThing");
  });
});

describe("agent path and args", () => {
  it("prefers CURSOR_AGENT_PATH then AGENT_PATH", () => {
    assert.equal(
      resolveAgentPath({ CURSOR_AGENT_PATH: "/x/agent", AGENT_PATH: "/y" }),
      "/x/agent",
    );
    assert.equal(resolveAgentPath({ AGENT_PATH: "/y/agent" }), "/y/agent");
    assert.equal(resolveAgentPath({}), "agent");
  });

  it("forwards CURSOR_API_KEY as --api-key", () => {
    const args = buildAgentModelsArgs({ CURSOR_API_KEY: "secret-key" });
    assert.deepEqual(args.slice(0, 2), ["--api-key", "secret-key"]);
    const print = buildAgentPrintArgs({
      model: "auto",
      workspace: "/tmp/ws",
      prompt: "hi",
      env: { CURSOR_API_KEY: "secret-key" },
    });
    assert.equal(print[0], "--api-key");
    assert.equal(print[1], "secret-key");
    assert.ok(print.includes("stream-json"));
    assert.ok(print.includes("--trust"));
    assert.ok(print.includes("--workspace"));
  });
});

describe("error redaction", () => {
  it("redacts key values but keeps env var names in help text", () => {
    const out = redactedStderr(
      "fail CURSOR_API_KEY=sk-abc123 rest; set CURSOR_API_KEY variable",
    );
    assert.doesNotMatch(out, /sk-abc123/);
    assert.match(out, /CURSOR_API_KEY=\[redacted\]/);
    assert.match(out, /set CURSOR_API_KEY variable/);
  });

  it("explains ENOENT clearly", () => {
    const err = Object.assign(new Error("spawn agent ENOENT"), {
      code: "ENOENT",
    });
    const msg = formatSpawnErrno("agent", err);
    assert.match(msg, /not found/);
    assert.match(msg, /CURSOR_AGENT_PATH/);
  });
});
