/**
 * In-process gateway dispatch for subagent spawning.
 *
 * When enabled, `callGateway` routes supported RPC methods (e.g. "agent",
 * "sessions.patch") directly to local handlers instead of opening a WebSocket
 * connection to the gateway server. This allows `sessions_spawn` and other
 * tools that call `callGateway` to work without a running gateway server.
 */
import { randomUUID } from "node:crypto";

import { loadConfig } from "../config/config.js";
import { loadModelCatalog } from "../agents/model-catalog.js";
import { updateSessionStore } from "../config/sessions.js";
import { defaultRuntime } from "../runtime.js";
import { createDefaultDeps } from "../cli/deps.js";
import { resolveGatewaySessionStoreTarget } from "./session-utils.js";
import { applySessionsPatchToStore } from "./sessions-patch.js";

let inProcessEnabled = false;

export function enableInProcessGateway(): void {
  inProcessEnabled = true;
}

export function disableInProcessGateway(): void {
  inProcessEnabled = false;
}

export function isInProcessGatewayEnabled(): boolean {
  return inProcessEnabled;
}

/**
 * Methods supported by the in-process dispatcher.
 */
const SUPPORTED_METHODS = new Set(["agent", "sessions.patch"]);

export function canDispatchInProcess(method: string): boolean {
  return inProcessEnabled && SUPPORTED_METHODS.has(method);
}

/**
 * Dispatch an RPC method in-process without a WebSocket round-trip.
 */
export async function dispatchInProcess<T = unknown>(
  method: string,
  params: unknown,
): Promise<T> {
  switch (method) {
    case "agent":
      return handleAgent(params) as T;
    case "sessions.patch":
      return handleSessionsPatch(params) as T;
    default:
      throw new Error(`in-process dispatch: unsupported method "${method}"`);
  }
}

/**
 * Handle the "agent" RPC method in-process.
 *
 * Mirrors the gateway server's agent handler: generates a runId, fires
 * `agentCommand` asynchronously (fire-and-forget), and returns immediately
 * with `{ runId, status: "accepted" }`.
 */
async function handleAgent(params: unknown): Promise<{ runId: string; status: string }> {
  const p = (params ?? {}) as Record<string, unknown>;
  const message = typeof p.message === "string" ? p.message.trim() : "";
  if (!message) {
    throw new Error("agent: message is required");
  }

  const idem =
    typeof p.idempotencyKey === "string" && p.idempotencyKey.trim()
      ? p.idempotencyKey.trim()
      : randomUUID();
  const runId = idem;

  // Fire agentCommand asynchronously — do not await.
  // Dynamic import to avoid circular dependency (agentCommand → callGateway → this module).
  void (async () => {
    try {
      const { agentCommand } = await import("../commands/agent.js");
      const cfg = loadConfig();
      const deps = createDefaultDeps();

      await agentCommand(
        {
          message,
          to: typeof p.to === "string" ? p.to.trim() || undefined : undefined,
          replyTo: typeof p.replyTo === "string" ? p.replyTo.trim() || undefined : undefined,
          sessionId: typeof p.sessionId === "string" ? p.sessionId.trim() || undefined : undefined,
          sessionKey:
            typeof p.sessionKey === "string" ? p.sessionKey.trim() || undefined : undefined,
          thinking: typeof p.thinking === "string" ? p.thinking.trim() || undefined : undefined,
          deliver: p.deliver === true,
          channel: typeof p.channel === "string" ? p.channel.trim() || undefined : undefined,
          replyChannel:
            typeof p.replyChannel === "string" ? p.replyChannel.trim() || undefined : undefined,
          accountId: typeof p.accountId === "string" ? p.accountId.trim() || undefined : undefined,
          replyAccountId:
            typeof p.replyAccountId === "string"
              ? p.replyAccountId.trim() || undefined
              : undefined,
          threadId: typeof p.threadId === "string" ? p.threadId.trim() || undefined : undefined,
          groupId: typeof p.groupId === "string" ? p.groupId.trim() || undefined : undefined,
          groupChannel:
            typeof p.groupChannel === "string" ? p.groupChannel.trim() || undefined : undefined,
          groupSpace:
            typeof p.groupSpace === "string" ? p.groupSpace.trim() || undefined : undefined,
          spawnedBy: typeof p.spawnedBy === "string" ? p.spawnedBy.trim() || undefined : undefined,
          timeout:
            typeof p.timeout === "number"
              ? String(p.timeout)
              : typeof p.timeout === "string"
                ? p.timeout
                : undefined,
          bestEffortDeliver: false,
          messageChannel:
            typeof p.channel === "string" ? p.channel.trim() || undefined : undefined,
          runId,
          lane: typeof p.lane === "string" ? p.lane.trim() || undefined : undefined,
          extraSystemPrompt:
            typeof p.extraSystemPrompt === "string" ? p.extraSystemPrompt : undefined,
        },
        defaultRuntime,
        deps,
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      defaultRuntime.error?.(`[in-process-gateway] agent run failed: ${errorMessage}`);
    }
  })();

  return { runId, status: "accepted" };
}

/**
 * Handle the "sessions.patch" RPC method in-process.
 *
 * Applies session patches (model override, thinking level, etc.) directly
 * to the session store without a WebSocket round-trip.
 */
async function handleSessionsPatch(
  params: unknown,
): Promise<{ ok: boolean; key?: string; error?: string }> {
  const p = (params ?? {}) as Record<string, unknown>;
  const key = typeof p.key === "string" ? p.key.trim() : "";
  if (!key) {
    throw new Error("sessions.patch: key is required");
  }

  const cfg = loadConfig();
  const target = resolveGatewaySessionStoreTarget({ cfg, key });
  const storePath = target.storePath;

  const applied = await updateSessionStore(storePath, async (store) => {
    const primaryKey = target.storeKeys[0] ?? key;
    const existingKey = target.storeKeys.find((candidate) => store[candidate]);
    if (existingKey && existingKey !== primaryKey && !store[primaryKey]) {
      store[primaryKey] = store[existingKey];
      delete store[existingKey];
    }
    return await applySessionsPatchToStore({
      cfg,
      store,
      storeKey: primaryKey,
      patch: p as import("./protocol/index.js").SessionsPatchParams,
      loadGatewayModelCatalog: async () => loadModelCatalog({ config: cfg }),
    });
  });

  if (!applied.ok) {
    const errorMessage =
      applied.error && typeof applied.error === "object" && "message" in applied.error
        ? String((applied.error as { message?: unknown }).message)
        : "sessions.patch failed";
    throw new Error(errorMessage);
  }

  return { ok: true, key: target.canonicalKey };
}
