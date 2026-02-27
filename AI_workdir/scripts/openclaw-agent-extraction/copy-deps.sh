#!/bin/bash
# Copy transitive dependencies from openclaw to openclaw-agent
SRC="C:/Users/User_DAIP/Work/Transcribe/Code/openclaw/src"
DST="C:/Users/User_DAIP/Work/Transcribe/Code/openclaw-agent/src"

copy_if_exists() {
  local rel="$1"
  local src_file="$SRC/$rel"
  local dst_file="$DST/$rel"
  if [ -f "$src_file" ]; then
    local dst_dir=$(dirname "$dst_file")
    mkdir -p "$dst_dir"
    if [ ! -f "$dst_file" ]; then
      cp "$src_file" "$dst_file"
      echo "COPIED: $rel"
    else
      echo "EXISTS: $rel"
    fi
  else
    echo "MISSING: $rel"
  fi
}

# ===== CONFIG =====
copy_if_exists "config/config.ts"
copy_if_exists "config/paths.ts"
copy_if_exists "config/io.ts"
copy_if_exists "config/cache-utils.ts"
copy_if_exists "config/sessions/paths.ts"
copy_if_exists "config/sessions/types.ts"
copy_if_exists "config/sessions/metadata.ts"
copy_if_exists "config/sessions/store.ts"
copy_if_exists "config/sessions/transcript.ts"
copy_if_exists "config/sessions/session-key.ts"
copy_if_exists "config/sessions/reset.ts"
copy_if_exists "config/sessions/main-session.ts"
copy_if_exists "config/sessions/group.ts"

# ===== ROOT UTILS =====
copy_if_exists "utils.ts"
copy_if_exists "globals.ts"
copy_if_exists "version.ts"
copy_if_exists "logging.ts"

# ===== LOGGER =====
copy_if_exists "logger.ts"

# ===== LOGGING =====
copy_if_exists "logging/subsystem.ts"
copy_if_exists "logging/redact.ts"
copy_if_exists "logging/diagnostic.ts"
copy_if_exists "logging/logger.ts"
copy_if_exists "logging/levels.ts"
copy_if_exists "logging/state.ts"
copy_if_exists "logging/console.ts"
copy_if_exists "logging/config.ts"

# ===== INFRA =====
copy_if_exists "infra/env.ts"
copy_if_exists "infra/exec-approvals.ts"
copy_if_exists "infra/heartbeat-wake.ts"
copy_if_exists "infra/node-shell.ts"
copy_if_exists "infra/shell-env.ts"
copy_if_exists "infra/system-events.ts"
copy_if_exists "infra/json-file.ts"
copy_if_exists "infra/retry.ts"
copy_if_exists "infra/warnings.ts"
copy_if_exists "infra/machine-name.ts"
copy_if_exists "infra/provider-usage.ts"
copy_if_exists "infra/provider-usage.types.ts"
copy_if_exists "infra/provider-usage.shared.ts"
copy_if_exists "infra/provider-usage.load.ts"
copy_if_exists "infra/provider-usage.format.ts"
copy_if_exists "infra/provider-usage.auth.ts"
copy_if_exists "infra/restart.ts"
copy_if_exists "infra/restart-sentinel.ts"
copy_if_exists "infra/diagnostic-events.ts"
copy_if_exists "infra/diagnostic-flags.ts"
copy_if_exists "infra/format-duration.ts"
copy_if_exists "infra/errors.ts"
copy_if_exists "infra/fs-safe.ts"
copy_if_exists "infra/dotenv.ts"

# ===== PROCESS =====
copy_if_exists "process/exec.ts"
copy_if_exists "process/spawn-utils.ts"
copy_if_exists "process/command-queue.ts"
copy_if_exists "process/lanes.ts"

# ===== GATEWAY =====
copy_if_exists "gateway/call.ts"
copy_if_exists "gateway/session-utils.ts"

# ===== MEDIA =====
copy_if_exists "media/mime.ts"
copy_if_exists "media/image-ops.ts"
copy_if_exists "media/constants.ts"

# ===== MARKDOWN =====
copy_if_exists "markdown/code-spans.ts"
copy_if_exists "markdown/fences.ts"

# ===== SCHEMA (agents/) =====
copy_if_exists "agents/schema/typebox.ts"
copy_if_exists "agents/schema/clean-for-gemini.ts"

# ===== AGENTS CORE FILES =====
copy_if_exists "agents/bash-process-registry.ts"
copy_if_exists "agents/shell-utils.ts"
copy_if_exists "agents/pty-dsr.ts"
copy_if_exists "agents/pty-keys.ts"
copy_if_exists "agents/apply-patch.ts"
copy_if_exists "agents/defaults.ts"
copy_if_exists "agents/context.ts"
copy_if_exists "agents/model-catalog.ts"
copy_if_exists "agents/agent-paths.ts"
copy_if_exists "agents/docs-path.ts"
copy_if_exists "agents/context-window-guard.ts"
copy_if_exists "agents/usage.ts"
copy_if_exists "agents/pi-settings.ts"

# ===== AGENTS PI-EMBEDDED =====
copy_if_exists "agents/pi-embedded-helpers.ts"
copy_if_exists "agents/pi-embedded-utils.ts"
copy_if_exists "agents/pi-embedded.ts"
copy_if_exists "agents/pi-embedded-runner.ts"
copy_if_exists "agents/pi-embedded-runner/google.ts"
copy_if_exists "agents/pi-embedded-runner/compact.ts"
copy_if_exists "agents/pi-embedded-runner/cache-ttl.ts"
copy_if_exists "agents/pi-embedded-runner/types.ts"
copy_if_exists "agents/pi-embedded-helpers/google.ts"
copy_if_exists "agents/pi-embedded-helpers/images.ts"
copy_if_exists "agents/pi-embedded-runner/run/images.ts"
copy_if_exists "agents/pi-embedded-subscribe.handlers.ts"
copy_if_exists "agents/pi-embedded-subscribe.handlers.types.ts"
copy_if_exists "agents/pi-embedded-subscribe.raw-stream.ts"

# ===== AUTO-REPLY =====
copy_if_exists "auto-reply/thinking.ts"
copy_if_exists "auto-reply/tokens.ts"
copy_if_exists "auto-reply/tool-meta.ts"
copy_if_exists "auto-reply/reply/queue.ts"
copy_if_exists "auto-reply/reply/agent-runner.ts"
copy_if_exists "auto-reply/heartbeat.ts"

# ===== SESSIONS =====
copy_if_exists "sessions/model-overrides.ts"

# ===== UTILS DIR =====
copy_if_exists "utils/delivery-context.ts"
copy_if_exists "utils/message-channel.ts"
copy_if_exists "utils/provider-utils.ts"
copy_if_exists "utils/queue-helpers.ts"
copy_if_exists "utils/boolean.ts"

# ===== ROUTING =====
copy_if_exists "routing/session-key.ts"

# ===== HOOKS =====
copy_if_exists "hooks/types.ts"

# ===== TYPES (type stubs) =====
copy_if_exists "types/lydell-node-pty.d.ts"
copy_if_exists "types/node-llama-cpp.d.ts"

# ===== CLI =====
copy_if_exists "cli/command-format.ts"

# ===== TERMINAL =====
copy_if_exists "terminal/progress-line.ts"

# ===== SANDBOX =====
copy_if_exists "agents/sandbox/context.ts"
copy_if_exists "agents/sandbox/docker.ts"
copy_if_exists "agents/sandbox/manage.ts"

# ===== AGENTS TOOL DISPLAY =====
copy_if_exists "agents/tool-display.json"

echo ""
echo "=== DONE ==="
