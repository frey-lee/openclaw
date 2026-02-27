import re
import os

base = "C:/Users/User_DAIP/Work/Transcribe/Code/openclaw/AI_workdir"

with open(os.path.join(base, "original_run.ts"), "r", encoding="utf-8") as f:
    orig_lines = [l.rstrip('\n') for l in f.readlines()]

with open(os.path.join(base, "agent_run.ts"), "r", encoding="utf-8") as f:
    agent_lines = [l.rstrip('\n') for l in f.readlines()]
    agent_content = '\n'.join(agent_lines)

print("=" * 80)
print("CATEGORIZED ANALYSIS OF DELETED LINES")
print("=" * 80)
print()

# Check which summary comments exist in agent
summary_patterns = [
    ("throwAuthProfileFailover body (L187-L206)", "// const throwAuthProfileFailover"),
    ("resolveApiKeyForCandidate body (L210-L213)", "// const resolveApiKeyForCandidate = async (candidate?: string) => { ... };"),
    ("applyApiKeyInfo body (L220-L241)", "// const applyApiKeyInfo = async (candidate?: string): Promise<void> => { ... };"),
    ("advanceAuthProfile body (L245-L264)", "// const advanceAuthProfile = async (): Promise<boolean> => { ... };"),
    ("auth rotation catch block (L285-L291)", "// } catch (err) { ... }"),
]

print("SUMMARY COMMENTS found in agent file covering deleted function bodies:")
for desc, pattern in summary_patterns:
    found = pattern in agent_content
    status = "FOUND" if found else "MISSING"
    print(f"  [{status}] {desc}")
    print(f"           Pattern: {pattern}")
print()

# Check params dropped from runEmbeddedAttempt call
print("PARAMS DROPPED from runEmbeddedAttempt call (L310-L319):")
param_names = [
    "messageTo", "messageThreadId", "groupId", "groupChannel", 
    "groupSpace", "spawnedBy", "currentChannelId", "currentThreadTs",
    "replyToMode", "hasRepliedRef"
]
for p in param_names:
    in_code = any(p in l and '//' not in l for l in agent_lines)
    in_comment = any(p in l and '//' in l for l in agent_lines)
    if in_code:
        status = "PRESENT (in code)"
    elif in_comment:
        status = "COMMENTED"
    else:
        status = "DELETED (no trace)"
    print(f"  [{status}] {p}")
print()

# Check the error handling block deletions
print("ERROR HANDLING features deleted (L359-L610):")
error_features = [
    ("timedOut destructure", "timedOut"),
    ("context overflow detection", "isContextOverflowError"),
    ("auto-compaction retry", "compactEmbeddedPiSessionDirect"),
    ("role ordering error handler", "roles must alternate"),
    ("image size error handler", "parseImageSizeError"),
    ("image dimension error handler", "parseImageDimensionError"),
    ("auth profile failure marking", "markAuthProfileFailure"),
    ("thinking-level fallback retry", "pickFallbackThinkingLevel"),
    ("FailoverError for quota/rate limit", "FailoverError"),
    ("auth failure detection", "isAuthAssistantError"),
    ("rate limit detection", "isRateLimitAssistantError"),
    ("failover failure detection", "isFailoverAssistantError"),
    ("profile rotation on error", "advanceAuthProfile"),
    ("cloudCodeAssist format error", "cloudCodeAssistFormatError"),
    ("normalizeUsage", "normalizeUsage"),
    ("markAuthProfileGood", "markAuthProfileGood"),
    ("markAuthProfileUsed", "markAuthProfileUsed"),
    ("formatAssistantErrorText", "formatAssistantErrorText"),
]
for desc, keyword in error_features:
    in_code = any(keyword in l and not l.strip().startswith('//') for l in agent_lines)
    in_comment = any(keyword in l and l.strip().startswith('//') for l in agent_lines)
    if in_code:
        status = "PRESENT (in code)"
    elif in_comment:
        status = "COMMENTED"
    else:
        status = "DELETED (no trace)"
    print(f"  [{status}] {desc}")
print()

# Other notable items
print("OTHER NOTABLE ITEMS:")
items = [
    ("scrubAnthropicRefusalMagic", "scrubAnthropicRefusalMagic"),
    ("skillsSnapshot param", "skillsSnapshot"),
    ("messageChannel param in attempt", "messageChannel"),
    ("messageProvider param in attempt", "messageProvider"),
    ("agentAccountId param in attempt", "agentAccountId"),
    ("resolvedToolResultFormat", "resolvedToolResultFormat"),
    ("isProbeSession", "isProbeSession"),
    ("overflowCompactionAttempted", "overflowCompactionAttempted"),
    ("attemptedThinking", "attemptedThinking"),
    ("client tool calls comment", "Handle client tool calls"),
]
for desc, keyword in items:
    in_code = any(keyword in l and not l.strip().startswith('//') for l in agent_lines)
    in_comment = any(keyword in l and l.strip().startswith('//') for l in agent_lines)
    if in_code:
        status = "PRESENT (in code)"
    elif in_comment:
        status = "COMMENTED"
    else:
        status = "DELETED (no trace)"
    print(f"  [{status}] {desc}")

