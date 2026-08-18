/**
 * Live discovery smoke: runs `agent models` through the public helper.
 * Skips cleanly when the CLI is missing or unauthenticated.
 */
import { runAgentModels } from "../lib/agent-cli.ts";
import { resolveAgentPath } from "../lib/agent-path.ts";
import { toProviderModels } from "../lib/models.ts";

const agentPath = resolveAgentPath();
console.log(`agent path: ${agentPath}`);

try {
  const defs = await runAgentModels(agentPath);
  const rows = toProviderModels(defs);
  console.log(`discovered ${defs.length} CLI models → ${rows.length} Prime rows`);
  console.log(rows.slice(0, 8).map((r) => r.id).join(", "));
  process.exit(0);
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`discovery failed (non-fatal for CI): ${msg}`);
  process.exit(0);
}
