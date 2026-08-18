/**
 * Model discovery, canonical mapping, and thinking-level mapping for Cursor CLI.
 * Verified against Cursor Agent CLI 2026.08.11-e8db854 and Prime Agent 0.7.3.
 */

export interface CursorModelDef {
  id: string;
  name: string;
  reasoning: boolean;
  contextWindow: number;
  maxTokens: number;
}

/** Prime Agent thinking levels (from @earendil-works/pi-ai ModelThinkingLevel). */
export type PrimeThinkingLevel =
  | "off"
  | "minimal"
  | "low"
  | "medium"
  | "high"
  | "xhigh"
  | "max";

export type ThinkingLevelMap = Partial<
  Record<PrimeThinkingLevel, string | null>
>;

/**
 * Static fallback / metadata table.
 * Source: reference pi-cursor-provider STATIC_MODELS plus local CLI help (2026-08-18).
 * Live `agent models` always wins when discovery succeeds.
 */
export const STATIC_MODELS: CursorModelDef[] = [
  { id: "auto", name: "Auto", reasoning: false, contextWindow: 200000, maxTokens: 32768 },
  { id: "composer-1.5", name: "Composer 1.5", reasoning: false, contextWindow: 200000, maxTokens: 32768 },
  { id: "composer-1", name: "Composer 1", reasoning: false, contextWindow: 200000, maxTokens: 32768 },
  { id: "opus-4.6-thinking", name: "Claude 4.6 Opus (Thinking)", reasoning: true, contextWindow: 200000, maxTokens: 32000 },
  { id: "opus-4.6", name: "Claude 4.6 Opus", reasoning: false, contextWindow: 200000, maxTokens: 32000 },
  { id: "opus-4.5-thinking", name: "Claude 4.5 Opus (Thinking)", reasoning: true, contextWindow: 200000, maxTokens: 32000 },
  { id: "opus-4.5", name: "Claude 4.5 Opus", reasoning: false, contextWindow: 200000, maxTokens: 32000 },
  { id: "sonnet-4.6-thinking", name: "Claude 4.6 Sonnet (Thinking)", reasoning: true, contextWindow: 200000, maxTokens: 32000 },
  { id: "sonnet-4.6", name: "Claude 4.6 Sonnet", reasoning: false, contextWindow: 200000, maxTokens: 32000 },
  { id: "sonnet-4.5-thinking", name: "Claude 4.5 Sonnet (Thinking)", reasoning: true, contextWindow: 200000, maxTokens: 32000 },
  { id: "sonnet-4.5", name: "Claude 4.5 Sonnet", reasoning: false, contextWindow: 200000, maxTokens: 32000 },
  { id: "gpt-5.3-codex", name: "GPT-5.3 Codex", reasoning: false, contextWindow: 200000, maxTokens: 32768 },
  { id: "gpt-5.3-codex-low", name: "GPT-5.3 Codex Low", reasoning: false, contextWindow: 200000, maxTokens: 32768 },
  { id: "gpt-5.3-codex-high", name: "GPT-5.3 Codex High", reasoning: true, contextWindow: 200000, maxTokens: 32768 },
  { id: "gpt-5.3-codex-xhigh", name: "GPT-5.3 Codex Extra High", reasoning: true, contextWindow: 200000, maxTokens: 32768 },
  { id: "gpt-5.3-codex-fast", name: "GPT-5.3 Codex Fast", reasoning: false, contextWindow: 200000, maxTokens: 32768 },
  { id: "gpt-5.3-codex-low-fast", name: "GPT-5.3 Codex Low Fast", reasoning: false, contextWindow: 200000, maxTokens: 32768 },
  { id: "gpt-5.3-codex-high-fast", name: "GPT-5.3 Codex High Fast", reasoning: true, contextWindow: 200000, maxTokens: 32768 },
  { id: "gpt-5.3-codex-xhigh-fast", name: "GPT-5.3 Codex Extra High Fast", reasoning: true, contextWindow: 200000, maxTokens: 32768 },
  { id: "gpt-5.2", name: "GPT-5.2", reasoning: false, contextWindow: 200000, maxTokens: 32768 },
  { id: "gpt-5.2-high", name: "GPT-5.2 High", reasoning: true, contextWindow: 200000, maxTokens: 32768 },
  { id: "gpt-5.2-codex", name: "GPT-5.2 Codex", reasoning: false, contextWindow: 200000, maxTokens: 32768 },
  { id: "gpt-5.2-codex-high", name: "GPT-5.2 Codex High", reasoning: true, contextWindow: 200000, maxTokens: 32768 },
  { id: "gpt-5.2-codex-low", name: "GPT-5.2 Codex Low", reasoning: false, contextWindow: 200000, maxTokens: 32768 },
  { id: "gpt-5.2-codex-xhigh", name: "GPT-5.2 Codex Extra High", reasoning: true, contextWindow: 200000, maxTokens: 32768 },
  { id: "gpt-5.2-codex-fast", name: "GPT-5.2 Codex Fast", reasoning: false, contextWindow: 200000, maxTokens: 32768 },
  { id: "gpt-5.2-codex-high-fast", name: "GPT-5.2 Codex High Fast", reasoning: true, contextWindow: 200000, maxTokens: 32768 },
  { id: "gpt-5.2-codex-low-fast", name: "GPT-5.2 Codex Low Fast", reasoning: false, contextWindow: 200000, maxTokens: 32768 },
  { id: "gpt-5.2-codex-xhigh-fast", name: "GPT-5.2 Codex Extra High Fast", reasoning: true, contextWindow: 200000, maxTokens: 32768 },
  { id: "gpt-5.1-high", name: "GPT-5.1 High", reasoning: true, contextWindow: 200000, maxTokens: 32768 },
  { id: "gpt-5.1-codex-max", name: "GPT-5.1 Codex Max", reasoning: true, contextWindow: 200000, maxTokens: 32768 },
  { id: "gpt-5.1-codex-max-high", name: "GPT-5.1 Codex Max High", reasoning: true, contextWindow: 200000, maxTokens: 32768 },
  { id: "gpt-5.1-codex-mini", name: "GPT-5.1 Codex Mini", reasoning: false, contextWindow: 200000, maxTokens: 32768 },
  { id: "gemini-3-pro", name: "Gemini 3 Pro", reasoning: false, contextWindow: 1000000, maxTokens: 65536 },
  { id: "gemini-3-flash", name: "Gemini 3 Flash", reasoning: false, contextWindow: 1000000, maxTokens: 65536 },
  { id: "grok", name: "Grok", reasoning: false, contextWindow: 131072, maxTokens: 32768 },
];

export const STATIC_MODELS_MAP = new Map(
  STATIC_MODELS.map((m) => [m.id, m] as const),
);

interface ModelVariants {
  default: string;
  minimal?: string;
  low?: string;
  medium?: string;
  high?: string;
  xhigh?: string;
  max?: string;
}

/**
 * Canonical Prime model IDs → Cursor CLI variant IDs.
 * Only used when the selected Prime id is a canonical family id.
 */
export const MODEL_MAP: Record<string, ModelVariants> = {
  "claude-sonnet-4-5": {
    default: "sonnet-4.5",
    minimal: "sonnet-4.5-thinking",
    low: "sonnet-4.5-thinking",
    medium: "sonnet-4.5-thinking",
    high: "sonnet-4.5-thinking",
    xhigh: "sonnet-4.5-thinking",
    max: "sonnet-4.5-thinking",
  },
  "claude-sonnet-4-6": {
    default: "sonnet-4.6",
    minimal: "sonnet-4.6-thinking",
    low: "sonnet-4.6-thinking",
    medium: "sonnet-4.6-thinking",
    high: "sonnet-4.6-thinking",
    xhigh: "sonnet-4.6-thinking",
    max: "sonnet-4.6-thinking",
  },
  "claude-opus-4-5": {
    default: "opus-4.5",
    minimal: "opus-4.5-thinking",
    low: "opus-4.5-thinking",
    medium: "opus-4.5-thinking",
    high: "opus-4.5-thinking",
    xhigh: "opus-4.5-thinking",
    max: "opus-4.5-thinking",
  },
  "claude-opus-4-6": {
    default: "opus-4.6",
    minimal: "opus-4.6-thinking",
    low: "opus-4.6-thinking",
    medium: "opus-4.6-thinking",
    high: "opus-4.6-thinking",
    xhigh: "opus-4.6-thinking",
    max: "opus-4.6-thinking",
  },
  "gpt-5.2": {
    default: "gpt-5.2",
    high: "gpt-5.2-high",
    xhigh: "gpt-5.2-high",
    max: "gpt-5.2-high",
  },
  "gpt-5.2-codex": {
    default: "gpt-5.2-codex",
    minimal: "gpt-5.2-codex-low",
    low: "gpt-5.2-codex-low",
    high: "gpt-5.2-codex-high",
    xhigh: "gpt-5.2-codex-xhigh",
    max: "gpt-5.2-codex-xhigh",
  },
  "gpt-5.2-codex-fast": {
    default: "gpt-5.2-codex-fast",
    minimal: "gpt-5.2-codex-low-fast",
    low: "gpt-5.2-codex-low-fast",
    high: "gpt-5.2-codex-high-fast",
    xhigh: "gpt-5.2-codex-xhigh-fast",
    max: "gpt-5.2-codex-xhigh-fast",
  },
  "gpt-5.3-codex": {
    default: "gpt-5.3-codex",
    minimal: "gpt-5.3-codex-low",
    low: "gpt-5.3-codex-low",
    high: "gpt-5.3-codex-high",
    xhigh: "gpt-5.3-codex-xhigh",
    max: "gpt-5.3-codex-xhigh",
  },
  "gpt-5.3-codex-fast": {
    default: "gpt-5.3-codex-fast",
    minimal: "gpt-5.3-codex-low-fast",
    low: "gpt-5.3-codex-low-fast",
    high: "gpt-5.3-codex-high-fast",
    xhigh: "gpt-5.3-codex-xhigh-fast",
    max: "gpt-5.3-codex-xhigh-fast",
  },
  "gpt-5.1": { default: "gpt-5.1-high" },
  "gpt-5.1-codex-max": {
    default: "gpt-5.1-codex-max",
    high: "gpt-5.1-codex-max-high",
    xhigh: "gpt-5.1-codex-max-high",
    max: "gpt-5.1-codex-max-high",
  },
  "gemini-3-pro-preview": { default: "gemini-3-pro" },
  "gemini-3-flash-preview": { default: "gemini-3-flash" },
  "grok-code-fast-1": { default: "grok" },
};

const PRIME_LEVELS: PrimeThinkingLevel[] = [
  "off",
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
];

const cursorDefaultToCanonical = new Map<string, string>();
const allMappedCursorIds = new Set<string>();
for (const [canonicalId, variants] of Object.entries(MODEL_MAP)) {
  if (variants.default) cursorDefaultToCanonical.set(variants.default, canonicalId);
  for (const cursorId of Object.values(variants)) {
    if (cursorId) allMappedCursorIds.add(cursorId);
  }
}

/** Convert Cursor CLI id → canonical Prime id; null hides variant-only rows. */
export function toCanonicalId(cursorId: string): string | null {
  const canonical = cursorDefaultToCanonical.get(cursorId);
  if (canonical) return canonical;
  if (allMappedCursorIds.has(cursorId)) return null;
  return cursorId;
}

/**
 * Resolve a Prime model id + optional thinking selection to a Cursor CLI model id.
 * `reasoning` may be a Prime level name or an already-mapped CLI id from thinkingLevelMap.
 */
export function toCursorId(canonicalId: string, reasoning?: string): string {
  if (
    reasoning &&
    !PRIME_LEVELS.includes(reasoning as PrimeThinkingLevel)
  ) {
    return reasoning;
  }

  const family = MODEL_MAP[canonicalId];
  if (!family) return canonicalId;

  if (!reasoning || reasoning === "off") {
    return family.default ?? canonicalId;
  }

  const level = reasoning as Exclude<PrimeThinkingLevel, "off">;
  return family[level] ?? family.default ?? canonicalId;
}

export function inferReasoning(id: string): boolean {
  return /(-thinking|-high|-xhigh|-max-high)$/.test(id);
}

/**
 * Parse `agent models` text output into model defs.
 * Verified format (CLI 2026.08.11): one `id - Name [(flags)]` line per model.
 */
export function parseAgentModelsOutput(output: string): CursorModelDef[] {
  const results: CursorModelDef[] = [];
  const lineRe =
    /^([a-zA-Z0-9][a-zA-Z0-9._-]*)\s+-\s+(.+?)(?:\s+\((?:current|default|current,\s*default)\))?$/;

  for (const line of output.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("Available") || trimmed.startsWith("Tip:")) {
      continue;
    }
    const match = lineRe.exec(trimmed);
    if (!match) continue;

    const id = match[1]!.trim();
    const rawName = match[2]!.trim();
    const known = STATIC_MODELS_MAP.get(id);
    results.push({
      id,
      name: rawName,
      reasoning: known?.reasoning ?? inferReasoning(id),
      contextWindow: known?.contextWindow ?? 200000,
      maxTokens: known?.maxTokens ?? 32768,
    });
  }
  return results;
}

function pickAvailable(
  candidate: string | undefined,
  available: Set<string>,
): string | null {
  if (!candidate) return null;
  return available.has(candidate) ? candidate : null;
}

/**
 * Build thinkingLevelMap so only variants that exist in the discovered set are offered.
 * Values are Cursor CLI model ids (Prime passes them back as options.reasoning).
 */
export function buildThinkingLevelMap(
  canonicalId: string,
  available: Set<string>,
): ThinkingLevelMap | undefined {
  const family = MODEL_MAP[canonicalId];
  if (!family) {
    // Direct CLI id with no family mapping: no thinkingLevelMap unless this id itself is a reasoning variant.
    return undefined;
  }

  const map: ThinkingLevelMap = {
    off: pickAvailable(family.default, available) ?? family.default,
  };

  for (const level of ["minimal", "low", "medium", "high", "xhigh", "max"] as const) {
    const preferred = pickAvailable(family[level], available);
    map[level] = preferred;
  }

  const hasAnyVariant = (["minimal", "low", "medium", "high", "xhigh", "max"] as const).some(
    (l) => map[l] != null && map[l] !== family.default,
  );
  if (!hasAnyVariant) return undefined;
  return map;
}

export interface ProviderModelRow {
  id: string;
  name: string;
  reasoning: boolean;
  input: ("text" | "image")[];
  cost: { input: number; output: number; cacheRead: number; cacheWrite: number };
  contextWindow: number;
  maxTokens: number;
  thinkingLevelMap?: ThinkingLevelMap;
}

/** Collapse discovered CLI models into Prime provider model rows (canonical ids). */
export function toProviderModels(defs: CursorModelDef[]): ProviderModelRow[] {
  const available = new Set(defs.map((d) => d.id));
  const seen = new Set<string>();
  const rows: ProviderModelRow[] = [];

  for (const m of defs) {
    const canonicalId = toCanonicalId(m.id);
    if (canonicalId === null) continue;
    const id = canonicalId !== m.id ? canonicalId : m.id;
    if (seen.has(id)) continue;
    seen.add(id);

    const thinkingLevelMap = buildThinkingLevelMap(id, available);
    rows.push({
      id,
      name: `${m.name} (Cursor)`,
      reasoning: Boolean(thinkingLevelMap) || m.reasoning,
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: m.contextWindow,
      maxTokens: m.maxTokens,
      ...(thinkingLevelMap ? { thinkingLevelMap } : {}),
    });
  }
  return rows;
}
