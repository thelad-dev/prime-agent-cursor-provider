import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Api, AssistantMessage, Model } from "@earendil-works/pi-ai";
import { streamCursorCli } from "../lib/stream.ts";

const MISSING_AGENT = "/nonexistent/cursor-agent-for-tests";

const model = {
  id: "auto",
  api: "cursor-cli",
  provider: "cursor",
} as unknown as Model<Api>;

const context = {
  systemPrompt: "sys",
  messages: [{ role: "user", content: "ping" }],
} as never;

/** Drain the stream the way Prime does: keep the message object and read it after the run. */
async function runWithMissingAgent(): Promise<AssistantMessage[]> {
  const previous = process.env["CURSOR_AGENT_PATH"];
  process.env["CURSOR_AGENT_PATH"] = MISSING_AGENT;
  try {
    const errors: AssistantMessage[] = [];
    for await (const event of streamCursorCli(model, context)) {
      if (event.type === "error") errors.push(event.error);
    }
    // Let a late `close` after the ENOENT `error` land before we read the message.
    await new Promise((r) => setTimeout(r, 50));
    return errors;
  } finally {
    if (previous === undefined) delete process.env["CURSOR_AGENT_PATH"];
    else process.env["CURSOR_AGENT_PATH"] = previous;
  }
}

describe("streamCursorCli when the agent binary is missing", () => {
  it("surfaces the actionable ENOENT guidance, not a bare exit code", async () => {
    const errors = await runWithMissingAgent();

    assert.equal(errors.length, 1);
    const message = errors[0]!.errorMessage ?? "";
    assert.match(
      message,
      /not found at '\/nonexistent\/cursor-agent-for-tests'\. Install the Cursor Agent CLI, or set CURSOR_AGENT_PATH \(or AGENT_PATH\)/,
    );
    assert.doesNotMatch(message, /exited with code/);
  });
});
