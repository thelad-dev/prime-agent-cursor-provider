import extension from "../index.ts";

const registered: Array<{ name: string; models: number; api?: string }> = [];
const commands: string[] = [];

const pi = {
  registerProvider(name: string, config: { models?: unknown[]; api?: string; streamSimple?: unknown }) {
    registered.push({
      name,
      models: Array.isArray(config.models) ? config.models.length : 0,
      api: config.api,
    });
    if (typeof config.streamSimple !== "function") {
      throw new Error("streamSimple missing");
    }
  },
  registerCommand(name: string) {
    commands.push(name);
  },
};

await extension(pi as never);
console.log(JSON.stringify({ registered, commands }, null, 2));
if (!registered.some((r) => r.name === "cursor" && r.models > 0 && r.api === "cursor-agent-cli")) {
  process.exit(1);
}
if (!commands.includes("cursor-login")) process.exit(1);
console.log("register smoke ok");
