// Simplified run.ts — single-provider linear flow for LLMaaS bridge usage.
// Original OpenClaw supports auth profile rotation, failover, compaction retry,
// thinking-level fallback, and model fallback chains. Those features are commented out
// below to preserve the architecture as reference.
import fs from "node:fs/promises";
// import type { ThinkLevel } from "../../auto-reply/thinking.js";
// import { enqueueCommandInLane } from "../../process/command-queue.js";
// import { resolveUserPath } from "../../utils.js";
// import { isMarkdownCapableMessageChannel } from "../../utils/message-channel.js";
// import { resolveOpenClawAgentDir } from "../agent-paths.js";
// import {
//   isProfileInCooldown,
//   markAuthProfileFailure,
//   markAuthProfileGood,
//   markAuthProfileUsed,
// } from "../auth-profiles.js";
// import {
//   CONTEXT_WINDOW_HARD_MIN_TOKENS,
//   CONTEXT_WINDOW_WARN_BELOW_TOKENS,
//   evaluateContextWindowGuard,
//   resolveContextWindowInfo,
// } from "../context-window-guard.js";
import { DEFAULT_CONTEXT_TOKENS, DEFAULT_MODEL, DEFAULT_PROVIDER } from "../defaults.js";
// import { FailoverError, resolveFailoverStatus } from "../failover-error.js";
import {
  // ensureAuthProfileStore,
  getApiKeyForModel,
  // resolveAuthProfileOrder,
  type ResolvedProviderAuth,
} from "../model-auth.js";
// import { normalizeProviderId } from "../model-selection.js";
// import { ensureOpenClawModelsJson } from "../models-config.js";
// import {
//   classifyFailoverReason,
//   formatAssistantErrorText,
//   isAuthAssistantError,
//   isCompactionFailureError,
//   isContextOverflowError,
//   isFailoverAssistantError,
//   isFailoverErrorMessage,
//   parseImageSizeError,
//   parseImageDimensionError,
//   isRateLimitAssistantError,
//   isTimeoutErrorMessage,
//   pickFallbackThinkingLevel,
//   type FailoverReason,
// } from "../pi-embedded-helpers.js";
// import { normalizeUsage, type UsageLike } from "../usage.js";

// import { compactEmbeddedPiSessionDirect } from "./compact.js";
// import { resolveGlobalLane, resolveSessionLane } from "./lanes.js";
import { log } from "./logger.js";
import { resolveModel } from "./model.js";
import { runEmbeddedAttempt } from "./run/attempt.js";
import type { RunEmbeddedPiAgentParams } from "./run/params.js";
import { buildEmbeddedRunPayloads } from "./run/payloads.js";
import type { EmbeddedPiAgentMeta, EmbeddedPiRunResult } from "./types.js";
import { describeUnknownError } from "./utils.js";

type ApiKeyInfo = ResolvedProviderAuth;

// --- Original (openclaw run.ts:58-68): Anthropic refusal magic scrubbing ---
// const ANTHROPIC_MAGIC_STRING_TRIGGER_REFUSAL = "ANTHROPIC_MAGIC_STRING_TRIGGER_REFUSAL";
// const ANTHROPIC_MAGIC_STRING_REPLACEMENT = "ANTHROPIC MAGIC STRING TRIGGER REFUSAL (redacted)";
//
// function scrubAnthropicRefusalMagic(prompt: string): string {
//   if (!prompt.includes(ANTHROPIC_MAGIC_STRING_TRIGGER_REFUSAL)) return prompt;
//   return prompt.replaceAll(
//     ANTHROPIC_MAGIC_STRING_TRIGGER_REFUSAL,
//     ANTHROPIC_MAGIC_STRING_REPLACEMENT,
//   );
// }
// --- End original ---

export async function runEmbeddedPiAgent(
  params: RunEmbeddedPiAgentParams,
): Promise<EmbeddedPiRunResult> {
  // --- Original (openclaw run.ts:73-90): session lane, global lane, enqueue,
  //     channel hint, tool result format, probe session ---
  // const sessionLane = resolveSessionLane(params.sessionKey?.trim() || params.sessionId);
  // const globalLane = resolveGlobalLane(params.lane);
  // const enqueueGlobal =
  //   params.enqueue ?? ((task, opts) => enqueueCommandInLane(globalLane, task, opts));
  // const enqueueSession =
  //   params.enqueue ?? ((task, opts) => enqueueCommandInLane(sessionLane, task, opts));
  // const channelHint = params.messageChannel ?? params.messageProvider;
  // const resolvedToolResultFormat =
  //   params.toolResultFormat ??
  //   (channelHint
  //     ? isMarkdownCapableMessageChannel(channelHint)
  //       ? "markdown"
  //       : "plain"
  //     : "markdown");
  // const isProbeSession = params.sessionId?.startsWith("probe-") ?? false;
  //
  // return enqueueSession(() =>
  //   enqueueGlobal(async () => { ... }));
  // --- End original ---

  const started = Date.now();
  // Original: const resolvedWorkspace = resolveUserPath(params.workspaceDir);
  const resolvedWorkspace = params.workspaceDir;
  const prevCwd = process.cwd();

  const provider = (params.provider ?? DEFAULT_PROVIDER).trim() || DEFAULT_PROVIDER;
  const modelId = (params.model ?? DEFAULT_MODEL).trim() || DEFAULT_MODEL;
  // Use workspaceDir as fallback instead of process.cwd() to avoid race conditions:
  // concurrent runs call process.chdir() in attempt.ts, making cwd unreliable.
  // Original: const agentDir = params.agentDir ?? resolveOpenClawAgentDir();
  const agentDir = params.agentDir ?? resolvedWorkspace;
  // Original: const fallbackConfigured = (params.config?.agents?.defaults?.model?.fallbacks?.length ?? 0) > 0;
  // Original: await ensureOpenClawModelsJson(params.config, agentDir);

  const { model, error, authStorage, modelRegistry } = resolveModel(
    provider,
    modelId,
    agentDir,
    params.config,
  );
  if (!model) {
    throw new Error(error ?? `Unknown model: ${provider}/${modelId}`);
  }

  // --- Original (openclaw run.ts:112-293): context window guard, auth store,
  //     profile order, rotation loop, api key resolution, advance logic ---
  // const ctxInfo = resolveContextWindowInfo({
  //   cfg: params.config,
  //   provider,
  //   modelId,
  //   modelContextWindow: model.contextWindow,
  //   defaultTokens: DEFAULT_CONTEXT_TOKENS,
  // });
  // const ctxGuard = evaluateContextWindowGuard({
  //   info: ctxInfo,
  //   warnBelowTokens: CONTEXT_WINDOW_WARN_BELOW_TOKENS,
  //   hardMinTokens: CONTEXT_WINDOW_HARD_MIN_TOKENS,
  // });
  // if (ctxGuard.shouldWarn) {
  //   log.warn(
  //     `low context window: ${provider}/${modelId} ctx=${ctxGuard.tokens} (warn<${CONTEXT_WINDOW_WARN_BELOW_TOKENS}) source=${ctxGuard.source}`,
  //   );
  // }
  // if (ctxGuard.shouldBlock) {
  //   log.error(
  //     `blocked model (context window too small): ${provider}/${modelId} ctx=${ctxGuard.tokens} (min=${CONTEXT_WINDOW_HARD_MIN_TOKENS}) source=${ctxGuard.source}`,
  //   );
  //   throw new FailoverError(
  //     `Model context window too small (${ctxGuard.tokens} tokens). Minimum is ${CONTEXT_WINDOW_HARD_MIN_TOKENS}.`,
  //     { reason: "unknown", provider, model: modelId },
  //   );
  // }
  //
  // const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
  // const preferredProfileId = params.authProfileId?.trim();
  // let lockedProfileId = params.authProfileIdSource === "user" ? preferredProfileId : undefined;
  // if (lockedProfileId) {
  //   const lockedProfile = authStore.profiles[lockedProfileId];
  //   if (
  //     !lockedProfile ||
  //     normalizeProviderId(lockedProfile.provider) !== normalizeProviderId(provider)
  //   ) {
  //     lockedProfileId = undefined;
  //   }
  // }
  // const profileOrder = resolveAuthProfileOrder({
  //   cfg: params.config,
  //   store: authStore,
  //   provider,
  //   preferredProfile: preferredProfileId,
  // });
  // if (lockedProfileId && !profileOrder.includes(lockedProfileId)) {
  //   throw new Error(`Auth profile "${lockedProfileId}" is not configured for ${provider}.`);
  // }
  // const profileCandidates = lockedProfileId
  //   ? [lockedProfileId]
  //   : profileOrder.length > 0
  //     ? profileOrder
  //     : [undefined];
  // let profileIndex = 0;
  //
  // const initialThinkLevel = params.thinkLevel ?? "off";
  // let thinkLevel = initialThinkLevel;
  // const attemptedThinking = new Set<ThinkLevel>();
  // let apiKeyInfo: ApiKeyInfo | null = null;
  // let lastProfileId: string | undefined;
  //
  // const resolveAuthProfileFailoverReason = (params: {
  //   allInCooldown: boolean;
  //   message: string;
  // }): FailoverReason => {
  //   if (params.allInCooldown) return "rate_limit";
  //   const classified = classifyFailoverReason(params.message);
  //   return classified ?? "auth";
  // };
  //
  // const throwAuthProfileFailover = (params: {
  //   allInCooldown: boolean;
  //   message?: string;
  //   error?: unknown;
  // }): never => { ... };
  //
  // const resolveApiKeyForCandidate = async (candidate?: string) => { ... };
  // const applyApiKeyInfo = async (candidate?: string): Promise<void> => { ... };
  // const advanceAuthProfile = async (): Promise<boolean> => { ... };
  //
  // // Auth profile rotation loop:
  // try {
  //   while (profileIndex < profileCandidates.length) {
  //     const candidate = profileCandidates[profileIndex];
  //     if (candidate && candidate !== lockedProfileId && isProfileInCooldown(authStore, candidate)) {
  //       profileIndex += 1;
  //       continue;
  //     }
  //     await applyApiKeyInfo(profileCandidates[profileIndex]);
  //     break;
  //   }
  //   if (profileIndex >= profileCandidates.length) {
  //     throwAuthProfileFailover({ allInCooldown: true });
  //   }
  // } catch (err) { ... }
  // --- End original ---

  // Simplified: single API key resolution, no auth profile rotation
  const apiKeyInfo: ApiKeyInfo = await getApiKeyForModel({
    model,
    cfg: params.config,
    agentDir,
  });
  if (apiKeyInfo.apiKey) {
    authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
  }

  try {
    await fs.mkdir(resolvedWorkspace, { recursive: true });

    const attempt = await runEmbeddedAttempt({
      sessionId: params.sessionId,
      sessionKey: params.sessionKey,
      sessionFile: params.sessionFile,
      workspaceDir: params.workspaceDir,
      agentDir,
      config: params.config,
      // Original: prompt: scrubAnthropicRefusalMagic(params.prompt),
      prompt: params.prompt,
      images: params.images,
      disableTools: params.disableTools,
      provider,
      modelId,
      model,
      authStorage,
      modelRegistry,
      thinkLevel: params.thinkLevel ?? "off",
      verboseLevel: params.verboseLevel,
      reasoningLevel: params.reasoningLevel,
      toolResultFormat: params.toolResultFormat,
      execOverrides: params.execOverrides,
      bashElevated: params.bashElevated,
      timeoutMs: params.timeoutMs,
      runId: params.runId,
      abortSignal: params.abortSignal,
      shouldEmitToolResult: params.shouldEmitToolResult,
      shouldEmitToolOutput: params.shouldEmitToolOutput,
      onPartialReply: params.onPartialReply,
      onAssistantMessageStart: params.onAssistantMessageStart,
      onBlockReply: params.onBlockReply,
      onBlockReplyFlush: params.onBlockReplyFlush,
      blockReplyBreak: params.blockReplyBreak,
      blockReplyChunking: params.blockReplyChunking,
      onReasoningStream: params.onReasoningStream,
      onToolResult: params.onToolResult,
      onAgentEvent: params.onAgentEvent,
      extraSystemPrompt: params.extraSystemPrompt,
      streamParams: params.streamParams,
      ownerNumbers: params.ownerNumbers,
      enforceFinalTag: params.enforceFinalTag,
    });

    const { aborted, promptError, sessionIdUsed, lastAssistant } = attempt;

    if (promptError && !aborted) {
      const errorText = describeUnknownError(promptError);
      // --- Original (openclaw run.ts:361-511): context overflow, compaction, role ordering
      //     detection, image size error handling, auth profile failover on prompt errors,
      //     thinking-level fallback retry ---
      // if (isContextOverflowError(errorText)) {
      //   const isCompactionFailure = isCompactionFailureError(errorText);
      //   if (!isCompactionFailure && !overflowCompactionAttempted) {
      //     log.warn(`context overflow detected; attempting auto-compaction for ${provider}/${modelId}`);
      //     overflowCompactionAttempted = true;
      //     const compactResult = await compactEmbeddedPiSessionDirect({
      //       sessionId: params.sessionId,
      //       sessionKey: params.sessionKey,
      //       messageChannel: params.messageChannel,
      //       messageProvider: params.messageProvider,
      //       agentAccountId: params.agentAccountId,
      //       authProfileId: lastProfileId,
      //       sessionFile: params.sessionFile,
      //       workspaceDir: params.workspaceDir,
      //       agentDir,
      //       config: params.config,
      //       skillsSnapshot: params.skillsSnapshot,
      //       provider,
      //       model: modelId,
      //       thinkLevel,
      //       reasoningLevel: params.reasoningLevel,
      //       bashElevated: params.bashElevated,
      //       extraSystemPrompt: params.extraSystemPrompt,
      //       ownerNumbers: params.ownerNumbers,
      //     });
      //     if (compactResult.compacted) {
      //       log.info(`auto-compaction succeeded for ${provider}/${modelId}; retrying prompt`);
      //       continue;
      //     }
      //     log.warn(`auto-compaction failed for ${provider}/${modelId}: ${compactResult.reason ?? "nothing to compact"}`);
      //   }
      //   const kind = isCompactionFailure ? "compaction_failure" : "context_overflow";
      //   return { payloads: [{ text: "Context overflow: prompt too large...", isError: true }], meta: { ... } };
      // }
      // if (/incorrect role information|roles must alternate/i.test(errorText)) {
      //   return { payloads: [{ text: "Message ordering conflict...", isError: true }], meta: { ... } };
      // }
      // const imageSizeError = parseImageSizeError(errorText);
      // if (imageSizeError) { ... return user-friendly image error ... }
      // const promptFailoverReason = classifyFailoverReason(errorText);
      // if (promptFailoverReason && promptFailoverReason !== "timeout" && lastProfileId) {
      //   await markAuthProfileFailure({ store: authStore, profileId: lastProfileId, reason: promptFailoverReason, cfg: params.config, agentDir: params.agentDir });
      // }
      // if (isFailoverErrorMessage(errorText) && promptFailoverReason !== "timeout" && (await advanceAuthProfile())) {
      //   continue;
      // }
      // const fallbackThinking = pickFallbackThinkingLevel({ message: errorText, attempted: attemptedThinking });
      // if (fallbackThinking) {
      //   log.warn(`unsupported thinking level for ${provider}/${modelId}; retrying with ${fallbackThinking}`);
      //   thinkLevel = fallbackThinking;
      //   continue;
      // }
      // if (fallbackConfigured && isFailoverErrorMessage(errorText)) {
      //   throw new FailoverError(errorText, { reason: promptFailoverReason ?? "unknown", provider, model: modelId, ... });
      // }
      // --- End original ---
      throw promptError;
    }

    // --- Original (openclaw run.ts:613-619): normalizeUsage, markAuthProfileGood,
    //     markAuthProfileUsed ---
    // const usage = normalizeUsage(lastAssistant?.usage as UsageLike);
    // if (lastProfileId) {
    //   await markAuthProfileGood({ store: authStore, provider, profileId: lastProfileId, agentDir: params.agentDir });
    //   await markAuthProfileUsed({ store: authStore, profileId: lastProfileId, agentDir: params.agentDir });
    // }
    // --- End original ---

    const agentMeta: EmbeddedPiAgentMeta = {
      sessionId: sessionIdUsed,
      provider: lastAssistant?.provider ?? provider,
      model: lastAssistant?.model ?? model.id,
      usage: lastAssistant?.usage as EmbeddedPiAgentMeta["usage"],
    };

    const payloads = buildEmbeddedRunPayloads({
      assistantTexts: attempt.assistantTexts,
      toolMetas: attempt.toolMetas,
      lastAssistant: attempt.lastAssistant,
      lastToolError: attempt.lastToolError,
      config: params.config,
      sessionKey: params.sessionKey ?? params.sessionId,
      verboseLevel: params.verboseLevel,
      reasoningLevel: params.reasoningLevel,
      toolResultFormat: params.toolResultFormat,
      inlineToolResultsAllowed: false,
    });

    log.debug(
      `embedded run done: runId=${params.runId} sessionId=${params.sessionId} durationMs=${Date.now() - started} aborted=${aborted}`,
    );

    return {
      payloads: payloads.length ? payloads : undefined,
      meta: {
        durationMs: Date.now() - started,
        agentMeta,
        aborted,
        systemPromptReport: attempt.systemPromptReport,
        stopReason: attempt.clientToolCall ? "tool_calls" : undefined,
        pendingToolCalls: attempt.clientToolCall
          ? [
              {
                id: `call_${Date.now()}`,
                name: attempt.clientToolCall.name,
                arguments: JSON.stringify(attempt.clientToolCall.params),
              },
            ]
          : undefined,
      },
      didSendViaMessagingTool: attempt.didSendViaMessagingTool,
      messagingToolSentTexts: attempt.messagingToolSentTexts,
      messagingToolSentTargets: attempt.messagingToolSentTargets,
    };
  } finally {
    process.chdir(prevCwd);
  }
}
