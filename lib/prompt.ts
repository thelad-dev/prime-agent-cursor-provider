/**
 * Serialize a Prime Agent Context into a single CLI prompt string.
 * Images become textual placeholders — Cursor Agent CLI --print does not accept image attachments
 * (verified: agent --help 2026.08.11; same limitation as pi-cursor-provider).
 */

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ImageBlock {
  type: "image";
  data: string;
  mimeType: string;
}

export type ContentBlock = TextBlock | ImageBlock;

export interface PromptMessage {
  role: "user" | "assistant" | "toolResult" | string;
  content: string | ContentBlock[];
  toolName?: string;
}

export interface PromptContext {
  systemPrompt?: string;
  messages: PromptMessage[];
}

export function contentBlockToText(block: ContentBlock): string {
  if (block.type === "text") return block.text;
  const bytes = Math.round((block.data.length * 3) / 4);
  return `[Image: ${block.mimeType}, ~${bytes} bytes — note: image input is not supported by the Cursor Agent CLI; the visual content cannot be passed through]`;
}

export function serializeContext(context: PromptContext): string {
  const lines: string[] = [];

  if (context.systemPrompt) {
    lines.push(`[System]\n${context.systemPrompt}\n`);
  }

  for (const msg of context.messages) {
    if (msg.role === "user") {
      const text =
        typeof msg.content === "string"
          ? msg.content
          : msg.content.map(contentBlockToText).join("\n");
      lines.push(`[User]\n${text}`);
    } else if (msg.role === "assistant") {
      const blocks = Array.isArray(msg.content) ? msg.content : [];
      const text = blocks
        .filter((c): c is TextBlock => c.type === "text")
        .map((c) => c.text)
        .join("\n");
      if (text.trim()) lines.push(`[Assistant]\n${text}`);
    } else if (msg.role === "toolResult") {
      const text =
        typeof msg.content === "string"
          ? msg.content
          : msg.content.map(contentBlockToText).join("\n");
      if (text.trim()) {
        lines.push(`[Tool result: ${msg.toolName ?? "tool"}]\n${text}`);
      }
    }
  }

  return lines.join("\n\n");
}
