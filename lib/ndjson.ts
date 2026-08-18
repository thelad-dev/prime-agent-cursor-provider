export interface CursorAssistantEvent {
  type: "assistant";
  message: { role: "assistant"; content: Array<{ type: "text"; text: string }> };
  session_id?: string;
}

export interface CursorToolCallPayload {
  args: Record<string, unknown>;
  result?: {
    success?: Record<string, unknown>;
    rejected?: { reason?: string };
    error?: { message?: string };
  };
}

export interface CursorToolCallEvent {
  type: "tool_call";
  subtype: "started" | "completed";
  tool_call: Record<string, CursorToolCallPayload>;
}

export interface CursorResultEvent {
  type: "result";
  subtype?: string;
  duration_ms?: number;
}

export type CursorStreamEvent =
  | CursorAssistantEvent
  | CursorToolCallEvent
  | CursorResultEvent
  | { type: string };

/** Parse one NDJSON line; malformed lines return null (no throw). */
export function parseNdjsonLine(line: string): CursorStreamEvent | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as CursorStreamEvent;
  } catch {
    return null;
  }
}
