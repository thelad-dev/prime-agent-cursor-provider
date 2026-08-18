/**
 * Custom streamSimple backend: spawn Cursor Agent CLI and map NDJSON → Prime events.
 * Tool calls are observational text only (no toolcall_* events) so Prime does not re-execute.
 */

import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import type {
  Api,
  AssistantMessage,
  AssistantMessageEventStream,
  Context,
  Model,
  SimpleStreamOptions,
  TextContent,
} from "@earendil-works/pi-ai";
import { createAssistantMessageEventStream } from "@earendil-works/pi-ai";
import {
  buildAgentPrintArgs,
  terminateChild,
} from "./agent-cli.ts";
import { resolveAgentPath } from "./agent-path.ts";
import { toCursorId } from "./models.ts";
import { parseNdjsonLine, type CursorToolCallEvent } from "./ndjson.ts";
import { serializeContext } from "./prompt.ts";
import { toDisplayToolName } from "./tools.ts";
import {
  formatSpawnError,
  formatSpawnErrno,
  redactedStderr,
} from "./errors.ts";

function appendTextDelta(
  output: AssistantMessage,
  stream: AssistantMessageEventStream,
  state: { textBlockOpen: boolean; accumulatedText: string },
  delta: string,
): void {
  if (!state.textBlockOpen) {
    output.content.push({ type: "text", text: "" });
    const idx = output.content.length - 1;
    stream.push({ type: "text_start", contentIndex: idx, partial: output });
    state.textBlockOpen = true;
  }
  const idx = output.content.length - 1;
  const textBlock = output.content[idx] as TextContent;
  textBlock.text += delta;
  state.accumulatedText += delta;
  stream.push({ type: "text_delta", contentIndex: idx, delta, partial: output });
}

export function streamCursorCli(
  model: Model<Api>,
  context: Context,
  options?: SimpleStreamOptions,
): AssistantMessageEventStream {
  const stream = createAssistantMessageEventStream();

  (async () => {
    const output: AssistantMessage = {
      role: "assistant",
      content: [],
      api: model.api,
      provider: model.provider,
      model: model.id,
      usage: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0,
        totalTokens: 0,
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
      },
      stopReason: "stop",
      timestamp: Date.now(),
    };

    try {
      const agentPath = resolveAgentPath();
      // Firstmate/Prime launch cwd is the assigned worktree; do not invent another root.
      const workspacePath = process.cwd();
      const prompt = serializeContext(context);
      const reasoning =
        typeof options?.reasoning === "string" ? options.reasoning : undefined;
      const cliModelId = toCursorId(model.id, reasoning);
      const args = buildAgentPrintArgs({
        model: cliModelId,
        workspace: workspacePath,
        prompt,
      });

      stream.push({ type: "start", partial: output });

      const child = spawn(agentPath, args, {
        stdio: ["ignore", "pipe", "pipe"],
        env: process.env,
        // New process group so terminateChild can signal the whole tree on Linux.
        detached: process.platform !== "win32",
      });

      const onAbort = () => terminateChild(child);
      options?.signal?.addEventListener("abort", onAbort, { once: true });

      const stderrChunks: string[] = [];
      child.stderr?.on("data", (chunk: Buffer) => {
        stderrChunks.push(chunk.toString());
      });

      const state = { textBlockOpen: false, accumulatedText: "" };
      const rl = createInterface({ input: child.stdout!, crlfDelay: Infinity });

      rl.on("line", (line: string) => {
        const event = parseNdjsonLine(line);
        if (!event) return;

        if (event.type === "assistant") {
          const content = (event as { message?: { content?: Array<{ type: string; text?: string }> } })
            .message?.content;
          if (!content) return;
          for (const block of content) {
            if (block.type !== "text" || !block.text?.trim()) continue;
            appendTextDelta(output, stream, state, block.text);
          }
          return;
        }

        if (event.type === "tool_call") {
          const tce = event as CursorToolCallEvent;
          const cliKey = Object.keys(tce.tool_call)[0];
          if (!cliKey) return;
          const toolName = toDisplayToolName(cliKey);
          if (tce.subtype === "started") {
            const payload = tce.tool_call[cliKey]!;
            const argsSnippet = JSON.stringify(payload.args ?? {});
            const brief =
              argsSnippet.length > 120
                ? `${argsSnippet.slice(0, 120)}…`
                : argsSnippet;
            appendTextDelta(output, stream, state, `\n⏳ [${toolName}] ${brief}\n`);
          } else if (tce.subtype === "completed") {
            appendTextDelta(output, stream, state, `\n✓ [${toolName}]\n`);
          }
        }
        // Unknown event types are ignored intentionally (forward-compatible with CLI updates).
      });

      await new Promise<void>((resolve) => {
        child.on("close", (code) => {
          options?.signal?.removeEventListener("abort", onAbort);

          if (state.textBlockOpen) {
            const idx = output.content.length - 1;
            stream.push({
              type: "text_end",
              contentIndex: idx,
              content: state.accumulatedText,
              partial: output,
            });
            state.textBlockOpen = false;
          }

          if (options?.signal?.aborted) {
            output.stopReason = "aborted";
            stream.push({ type: "error", reason: "aborted", error: output });
            stream.end();
            resolve();
            return;
          }

          if (code !== 0 && !state.accumulatedText) {
            const stderr = stderrChunks.join("").trim();
            output.stopReason = "error";
            // Never include env or API keys; stderr from agent is user-facing auth/CLI errors.
            output.errorMessage =
              redactedStderr(stderr) ||
              (code === null
                ? "Cursor CLI terminated unexpectedly"
                : formatSpawnError(agentPath, code));
            stream.push({ type: "error", reason: "error", error: output });
            stream.end();
            resolve();
            return;
          }

          stream.push({ type: "done", reason: "stop", message: output });
          stream.end();
          resolve();
        });

        child.on("error", (err) => {
          options?.signal?.removeEventListener("abort", onAbort);
          output.stopReason = "error";
          output.errorMessage = formatSpawnErrno(agentPath, err);
          stream.push({ type: "error", reason: "error", error: output });
          stream.end();
          resolve();
        });
      });
    } catch (error) {
      output.stopReason = options?.signal?.aborted ? "aborted" : "error";
      output.errorMessage =
        error instanceof Error ? error.message : String(error);
      stream.push({
        type: "error",
        reason: output.stopReason as "aborted" | "error",
        error: output,
      });
      stream.end();
    }
  })();

  return stream;
}

