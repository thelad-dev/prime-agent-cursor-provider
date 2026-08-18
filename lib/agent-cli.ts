import { spawn, type ChildProcess } from "node:child_process";
import { resolveAgentPath } from "./agent-path.ts";
import { redactedStderr } from "./errors.ts";
import {
  parseAgentModelsOutput,
  type CursorModelDef,
} from "./models.ts";

export const DISCOVERY_TIMEOUT_MS = 15_000;
export const STATUS_TIMEOUT_MS = 15_000;
export const LOGOUT_TIMEOUT_MS = 30_000;
/** Login is interactive (browser/device code), so it gets a much longer leash. */
export const LOGIN_TIMEOUT_MS = 300_000;
export const KILL_GRACE_MS = 2_000;

/**
 * New process group so terminateChild can signal the whole tree.
 * Only for children with piped stdio: a detached child that inherits the
 * terminal is a background process group and would stop on SIGTTIN when reading.
 */
const DETACHED = process.platform !== "win32";

export function buildAgentModelsArgs(): string[] {
  return ["models"];
}

export function buildAgentPrintArgs(opts: {
  model: string;
  workspace: string;
  prompt: string;
}): string[] {
  return [
    "--print",
    "--output-format",
    "stream-json",
    "--model",
    opts.model,
    "--trust",
    "--workspace",
    opts.workspace,
    opts.prompt,
  ];
}

/**
 * Kill a child and attempt process-group cleanup to avoid zombie agent trees.
 * Uses SIGTERM then SIGKILL after grace.
 */
export function terminateChild(
  child: ChildProcess,
  graceMs: number = KILL_GRACE_MS,
): void {
  if (child.killed) return;
  const pid = child.pid;
  try {
    child.kill("SIGTERM");
  } catch {
    /* ignore */
  }
  if (pid) {
    try {
      process.kill(-pid, "SIGTERM");
    } catch {
      /* not a process group leader or already gone */
    }
  }
  setTimeout(() => {
    if (child.killed || child.exitCode != null) return;
    try {
      child.kill("SIGKILL");
    } catch {
      /* ignore */
    }
    if (pid) {
      try {
        process.kill(-pid, "SIGKILL");
      } catch {
        /* ignore */
      }
    }
  }, graceMs).unref?.();
}

/**
 * Arm a teardown timer for a child. Returns a disarm callback for the exit paths.
 */
function armTimeout(
  child: ChildProcess,
  timeoutMs: number,
  label: string,
  onTimeout: (err: Error) => void,
): () => void {
  const timer = setTimeout(() => {
    terminateChild(child);
    onTimeout(new Error(`${label} timed out after ${timeoutMs}ms`));
  }, timeoutMs);
  return () => clearTimeout(timer);
}

export function runAgentModels(
  agentPath: string = resolveAgentPath(),
  env: NodeJS.ProcessEnv = process.env,
  timeoutMs: number = DISCOVERY_TIMEOUT_MS,
): Promise<CursorModelDef[]> {
  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    // CURSOR_API_KEY reaches the CLI through the child env only, never argv.
    const child = spawn(agentPath, buildAgentModelsArgs(), {
      stdio: ["ignore", "pipe", "pipe"],
      env,
      detached: DETACHED,
    });

    const disarm = armTimeout(child, timeoutMs, "agent models", reject);

    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("error", (err) => {
      disarm();
      reject(err);
    });

    child.on("close", (code) => {
      disarm();
      if (code !== 0) {
        reject(
          new Error(
            `agent models exited with code ${code}: ${redactedStderr(stderr.trim()) || "(no stderr)"}`,
          ),
        );
        return;
      }
      const models = parseAgentModelsOutput(stdout);
      if (models.length === 0) {
        reject(new Error("agent models returned no models"));
        return;
      }
      resolve(models);
    });
  });
}

export function runAgentStatus(
  agentPath: string = resolveAgentPath(),
  env: NodeJS.ProcessEnv = process.env,
  timeoutMs: number = STATUS_TIMEOUT_MS,
): Promise<string> {
  return new Promise((resolve, reject) => {
    let out = "";
    const child = spawn(agentPath, ["status"], {
      stdio: ["ignore", "pipe", "pipe"],
      env,
      detached: DETACHED,
    });

    const disarm = armTimeout(child, timeoutMs, "agent status", reject);

    child.stdout?.on("data", (c: Buffer) => {
      out += c.toString();
    });
    child.stderr?.on("data", (c: Buffer) => {
      out += c.toString();
    });
    child.on("error", (err) => {
      disarm();
      reject(err);
    });
    child.on("close", () => {
      disarm();
      resolve(redactedStderr(out.trim()));
    });
  });
}

export function runAgentLogin(
  agentPath: string = resolveAgentPath(),
  env: NodeJS.ProcessEnv = process.env,
  timeoutMs: number = LOGIN_TIMEOUT_MS,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(agentPath, ["login"], {
      stdio: "inherit",
      env: { ...env, NO_OPEN_BROWSER: "1" },
    });

    const disarm = armTimeout(child, timeoutMs, "agent login", reject);

    child.on("error", (err) => {
      disarm();
      reject(err);
    });
    child.on("close", (code) => {
      disarm();
      if (code === 0) resolve();
      else reject(new Error(`agent login exited with code ${code}`));
    });
  });
}

export function runAgentLogout(
  agentPath: string = resolveAgentPath(),
  env: NodeJS.ProcessEnv = process.env,
  timeoutMs: number = LOGOUT_TIMEOUT_MS,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(agentPath, ["logout"], {
      stdio: "inherit",
      env,
    });

    const disarm = armTimeout(child, timeoutMs, "agent logout", reject);

    child.on("error", (err) => {
      disarm();
      reject(err);
    });
    child.on("close", (code) => {
      disarm();
      if (code === 0) resolve();
      else reject(new Error(`agent logout exited with code ${code}`));
    });
  });
}
