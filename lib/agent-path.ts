/** Resolve the Cursor Agent CLI binary path. */
export function resolveAgentPath(
  env: NodeJS.ProcessEnv = process.env,
): string {
  return env["CURSOR_AGENT_PATH"] ?? env["AGENT_PATH"] ?? "agent";
}
