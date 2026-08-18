import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildThinkingLevelMap,
  parseAgentModelsOutput,
  toCanonicalId,
  toCursorId,
  toProviderModels,
  STATIC_MODELS,
} from "../lib/models.ts";

describe("parseAgentModelsOutput", () => {
  it("parses verified agent models lines", () => {
    const output = [
      "Available models",
      "",
      "auto - Auto",
      "opus-4.6-thinking - Claude 4.6 Opus (Thinking)  (default)",
      "sonnet-4.6 - Claude 4.6 Sonnet  (current)",
      "gpt-5.3-codex-xhigh - GPT-5.3 Codex Extra High",
      "Tip: use --model <id>",
    ].join("\n");

    const models = parseAgentModelsOutput(output);
    assert.equal(models.length, 4);
    assert.equal(models[0]!.id, "auto");
    assert.equal(models[1]!.id, "opus-4.6-thinking");
    assert.equal(models[1]!.reasoning, true);
    assert.equal(models[2]!.name, "Claude 4.6 Sonnet");
    assert.equal(models[3]!.reasoning, true);
  });

  it("returns empty for unusable output", () => {
    assert.deepEqual(parseAgentModelsOutput("Authentication required"), []);
  });
});

describe("canonical mapping", () => {
  it("maps defaults to canonical and hides variants", () => {
    assert.equal(toCanonicalId("sonnet-4.6"), "claude-sonnet-4-6");
    assert.equal(toCanonicalId("sonnet-4.6-thinking"), null);
    assert.equal(toCanonicalId("brand-new-model"), "brand-new-model");
  });

  it("resolves thinking levels to CLI variants", () => {
    assert.equal(toCursorId("claude-opus-4-6", "off"), "opus-4.6");
    assert.equal(toCursorId("claude-opus-4-6", "xhigh"), "opus-4.6-thinking");
    assert.equal(toCursorId("gpt-5.3-codex", "max"), "gpt-5.3-codex-xhigh");
    assert.equal(
      toCursorId("claude-opus-4-6", "opus-4.6-thinking"),
      "opus-4.6-thinking",
    );
  });
});

describe("thinkingLevelMap", () => {
  it("only maps variants present in discovery", () => {
    const available = new Set(["opus-4.6", "opus-4.6-thinking"]);
    const map = buildThinkingLevelMap("claude-opus-4-6", available);
    assert.ok(map);
    assert.equal(map!.off, "opus-4.6");
    assert.equal(map!.high, "opus-4.6-thinking");
    assert.equal(map!.xhigh, "opus-4.6-thinking");
  });

  it("returns undefined when no reasoning variants exist", () => {
    const available = new Set(["auto"]);
    assert.equal(buildThinkingLevelMap("auto", available), undefined);
  });
});

describe("toProviderModels", () => {
  it("collapses variants into canonical rows with thinking maps", () => {
    const rows = toProviderModels([
      {
        id: "opus-4.6",
        name: "Claude 4.6 Opus",
        reasoning: false,
        contextWindow: 200000,
        maxTokens: 32000,
      },
      {
        id: "opus-4.6-thinking",
        name: "Claude 4.6 Opus (Thinking)",
        reasoning: true,
        contextWindow: 200000,
        maxTokens: 32000,
      },
      {
        id: "auto",
        name: "Auto",
        reasoning: false,
        contextWindow: 200000,
        maxTokens: 32768,
      },
    ]);
    const ids = rows.map((r) => r.id);
    assert.deepEqual(ids, ["claude-opus-4-6", "auto"]);
    const opus = rows[0]!;
    assert.equal(opus.reasoning, true);
    assert.ok(opus.thinkingLevelMap);
    assert.equal(opus.thinkingLevelMap!.high, "opus-4.6-thinking");
  });

  it("fallback static list produces at least auto", () => {
    const rows = toProviderModels(STATIC_MODELS);
    assert.ok(rows.some((r) => r.id === "auto"));
    assert.ok(rows.length >= 5);
  });
});
