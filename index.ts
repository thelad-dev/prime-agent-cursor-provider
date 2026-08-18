/**
 * Prime Agent Cursor Provider Extension
 *
 * Routes Prime Agent model requests through the Cursor Agent CLI (`agent`).
 * This is a native custom streamSimple provider — not OpenAI-compatible HTTP and not models.json.
 *
 * Verified against:
 *   - prime-agent 0.7.3 (pi.registerProvider + streamSimple)
 *   - Cursor Agent CLI 2026.08.11-e8db854 (agent --print --output-format stream-json)
 *
 * Auth stays with Cursor (`agent login` / CURSOR_API_KEY). Firstmate must not store Cursor OAuth tokens.
 */

import type { Api } from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "prime-agent";
import {
  runAgentLogin,
  runAgentLogout,
  runAgentModels,
  runAgentStatus,
} from "./lib/agent-cli.ts";
import { resolveAgentPath } from "./lib/agent-path.ts";
import { STATIC_MODELS, toProviderModels } from "./lib/models.ts";
import { streamCursorCli } from "./lib/stream.ts";

export default async function (pi: ExtensionAPI): Promise<void> {
  const agentPath = resolveAgentPath();

  let modelDefs = STATIC_MODELS;
  try {
    modelDefs = await runAgentModels(agentPath);
  } catch {
    // Fallback only — discovery failure must not crash Prime Agent startup.
    modelDefs = STATIC_MODELS;
  }

  pi.registerProvider("cursor", {
    name: "Cursor",
    baseUrl: "cli://cursor-agent",
    // ProviderConfig requires apiKey when models are set. Real Cursor auth is delegated to
    // `agent login` / child env CURSOR_API_KEY (forwarded in buildAgentPrintArgs), not Prime HTTP.
    // A non-env sentinel avoids Prime treating missing CURSOR_API_KEY as hard provider failure.
    apiKey: "cursor-cli-delegated-auth",
    api: "cursor-agent-cli" as Api,
    models: toProviderModels(modelDefs),
    streamSimple: streamCursorCli,
  });

  pi.registerCommand("cursor-login", {
    description: "Log in to Cursor (runs `agent login`)",
    handler: async (_args, ctx) => {
      ctx.ui.notify(
        "Starting Cursor login (NO_OPEN_BROWSER=1 — copy the URL from the terminal)…",
        "info",
      );
      try {
        await runAgentLogin(agentPath);
        ctx.ui.notify("Cursor login successful.", "info");
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        ctx.ui.notify(`Cursor login failed: ${msg}`, "error");
      }
    },
  });

  pi.registerCommand("cursor-status", {
    description: "Show Cursor authentication status (runs `agent status`)",
    handler: async (_args, ctx) => {
      try {
        const status = await runAgentStatus(agentPath);
        ctx.ui.notify(status || "No output from `agent status`.", "info");
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        ctx.ui.notify(`Could not get Cursor status: ${msg}`, "error");
      }
    },
  });

  pi.registerCommand("cursor-logout", {
    description: "Log out of Cursor (runs `agent logout`)",
    handler: async (_args, ctx) => {
      try {
        await runAgentLogout(agentPath);
        ctx.ui.notify("Logged out of Cursor.", "info");
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        ctx.ui.notify(`Cursor logout failed: ${msg}`, "error");
      }
    },
  });
}
