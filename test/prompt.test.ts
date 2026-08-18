import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { serializeContext } from "../lib/prompt.ts";

describe("serializeContext", () => {
  it("includes system, user, assistant, and tool results", () => {
    const text = serializeContext({
      systemPrompt: "Be brief.",
      messages: [
        { role: "user", content: "Hello" },
        {
          role: "assistant",
          content: [{ type: "text", text: "Hi there" }],
        },
        {
          role: "toolResult",
          toolName: "Read",
          content: [{ type: "text", text: "file contents" }],
        },
      ],
    });
    assert.match(text, /\[System\]\nBe brief\./);
    assert.match(text, /\[User\]\nHello/);
    assert.match(text, /\[Assistant\]\nHi there/);
    assert.match(text, /\[Tool result: Read\]\nfile contents/);
  });

  it("replaces images with placeholders", () => {
    const text = serializeContext({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "see this" },
            { type: "image", data: "aaaa", mimeType: "image/png" },
          ],
        },
      ],
    });
    assert.match(text, /Image: image\/png/);
    assert.doesNotMatch(text, /aaaa/);
  });
});
