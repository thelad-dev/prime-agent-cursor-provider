/**
 * Strip secret *values* from stderr before surfacing.
 * Do not redact bare env-var names like `CURSOR_API_KEY` in help text.
 */
export function redactedStderr(stderr: string): string {
  return stderr
    .replace(/\bCURSOR_API_KEY[=:]\s*\S+/gi, "CURSOR_API_KEY=[redacted]")
    .replace(/\bCURSOR_AUTH_TOKEN[=:]\s*\S+/gi, "CURSOR_AUTH_TOKEN=[redacted]")
    .replace(/\b(?:api[_-]?key|auth[_-]?token)[=:]\s*\S+/gi, "[redacted]");
}

export function formatSpawnError(agentPath: string, code: number): string {
  return `Cursor Agent CLI (${agentPath}) exited with code ${code}`;
}

export function formatSpawnErrno(agentPath: string, err: Error): string {
  const anyErr = err as NodeJS.ErrnoException;
  if (anyErr.code === "ENOENT") {
    return `Cursor Agent CLI not found at '${agentPath}'. Install the Cursor Agent CLI, or set CURSOR_AGENT_PATH (or AGENT_PATH) to the binary.`;
  }
  return err.message;
}
