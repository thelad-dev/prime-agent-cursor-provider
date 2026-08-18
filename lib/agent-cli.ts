import { spawn, type ChildProcess } from "node:child_process";
import { resolveAgentPath } from "./agent-path.ts";
import {
  parseAgentModelsOutput,
  type CursorModelDef,
} from "./models.ts";

export const DISCOVERY_TIMEOUT_MS = 15_000;
export const KILL_GRACE_MS = 2_000;

export function buildAgentModelsArgs(
  env: NodeJS.ProcessEnv = process.env,
): string[] {
  const args = ["models"];
  // Pass key on argv only when set; never log it.
  if (env["CURSOR_API_KEY"]) {
    args.unshift("--api-key", env["CURSOR_API_KEY"]);
  }
  return args;
}

export function buildAgentPrintArgs(opts: {
  model: string;
  workspace: string;
  prompt: string;
  env?: NodeJS.ProcessEnv;
}): string[] {
  const env = opts.env ?? process.env;
  const args = [
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
  if (env["CURSOR_API_KEY"]) {
    args.unshift("--api-key", env["CURSOR_API_KEY"]);
  }
  return args;
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

export function runAgentModels(
  agentPath: string = resolveAgentPath(),
  env: NodeJS.ProcessEnv = process.env,
  timeoutMs: number = DISCOVERY_TIMEOUT_MS,
): Promise<CursorModelDef[]> {
  return new Promise((resolve, reject) => {
    const args = buildAgentModelsArgs(env);
    let stdout = "";
    let stderr = "";
    const child = spawn(agentPath, args, {
      stdio: ["ignore", "pipe", "pipe"],
      env,
    });

    const timeout = setTimeout(() => {
      terminateChild(child);
      reject(new Error(`agent models timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    child.on("close", (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        reject(
          new Error(
            `agent models exited with code ${code}: ${stderr.trim() || "(no stderr)"}`,
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
): Promise<string> {
  return new Promise((resolve, reject) => {
    let out = "";
    const child = spawn(agentPath, ["status"], {
      stdio: ["ignore", "pipe", "pipe"],
      env,
    });
    child.stdout?.on("data", (c: Buffer) => {
      out += c.toString();
    });
    child.stderr?.on("data", (c: Buffer) => {
      out += c.toString();
    });
    child.on("error", reject);
    child.on("close", () => resolve(out.trim()));
  });
}

export function runAgentLogin(
  agentPath: string = resolveAgentPath(),
  env: NodeJS.ProcessEnv = process.env,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(agentPath, ["login"], {
      stdio: "inherit",
      env: { ...env, NO_OPEN_BROWSER: "1" },
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`agent login exited with code ${code}`));
    });
  });
}

export function runAgentLogout(
  agentPath: string = resolveAgentPath(),
  env: NodeJS.ProcessEnv = process.env,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(agentPath, ["logout"], {
      stdio: "inherit",
      env,
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`agent logout exited with code ${code}`));
    });
  });
}
