import fs from 'node:fs';
import path from 'node:path';

const SRC = 'C:/Users/User_DAIP/Work/Transcribe/Code/openclaw/src';
const DST = 'C:/Users/User_DAIP/Work/Transcribe/Code/openclaw-agent/src';

function copyIfExists(rel) {
  const srcFile = path.join(SRC, rel);
  const dstFile = path.join(DST, rel);
  if (fs.existsSync(srcFile)) {
    const dstDir = path.dirname(dstFile);
    if (!fs.existsSync(dstDir)) {
      fs.mkdirSync(dstDir, { recursive: true });
    }
    if (!fs.existsSync(dstFile)) {
      fs.copyFileSync(srcFile, dstFile);
      console.log(`COPIED: ${rel}`);
      return 'copied';
    } else {
      console.log(`EXISTS: ${rel}`);
      return 'exists';
    }
  } else {
    console.log(`MISSING: ${rel}`);
    return 'missing';
  }
}

const files = [
  // CONFIG - core types chain
  'config/config.ts', 'config/paths.ts', 'config/types.ts', 'config/io.ts',
  'config/types.base.ts', 'config/types.openclaw.ts', 'config/types.agents.ts',
  'config/types.agent-defaults.ts', 'config/types.approvals.ts', 'config/types.auth.ts',
  'config/types.browser.ts', 'config/types.channels.ts', 'config/types.cron.ts',
  'config/types.discord.ts', 'config/types.gateway.ts', 'config/types.googlechat.ts',
  'config/types.hooks.ts', 'config/types.imessage.ts', 'config/types.messages.ts',
  'config/types.models.ts', 'config/types.msteams.ts', 'config/types.node-host.ts',
  'config/types.plugins.ts', 'config/types.queue.ts', 'config/types.sandbox.ts',
  'config/types.signal.ts', 'config/types.slack.ts', 'config/types.telegram.ts',
  'config/types.tts.ts', 'config/types.tools.ts', 'config/types.whatsapp.ts',
  'config/runtime-overrides.ts', 'config/defaults.ts', 'config/env-vars.ts',
  'config/cache-utils.ts', 'config/port-defaults.ts', 'config/logging.ts',
  'config/env-substitution.ts', 'config/normalize-paths.ts', 'config/merge-config.ts',
  'config/merge-patch.ts', 'config/validation.ts', 'config/schema.ts',
  'config/zod-schema.ts', 'config/legacy-migrate.ts', 'config/includes.ts',
  'config/agent-dirs.ts', 'config/agent-limits.ts', 'config/config-paths.ts',
  'config/talk.ts', 'config/telegram-custom-commands.ts',
  'config/plugin-auto-enable.ts', 'config/markdown-tables.ts',
  'config/legacy.ts', 'config/legacy.shared.ts', 'config/legacy.rules.ts',
  'config/legacy.migrations.ts', 'config/legacy.migrations.part-1.ts',
  'config/legacy.migrations.part-2.ts', 'config/legacy.migrations.part-3.ts',
  'config/commands.ts', 'config/channel-capabilities.ts', 'config/group-policy.ts',

  // CONFIG/SESSIONS
  'config/sessions/paths.ts', 'config/sessions/types.ts',
  'config/sessions/metadata.ts', 'config/sessions/store.ts',
  'config/sessions/session-key.ts', 'config/sessions/reset.ts',
  'config/sessions/main-session.ts', 'config/sessions/group.ts',
  'config/sessions/transcript.ts',

  // ROOT FILES
  'utils.ts', 'globals.ts', 'version.ts', 'logger.ts',

  // LOGGING
  'logging/subsystem.ts', 'logging/redact.ts', 'logging/diagnostic.ts',

  // INFRA
  'infra/env.ts', 'infra/exec-approvals.ts', 'infra/shell-env.ts',
  'infra/provider-usage.ts', 'infra/provider-usage.types.ts',
  'infra/provider-usage.shared.ts', 'infra/provider-usage.load.ts',
  'infra/provider-usage.format.ts',
  'infra/restart.ts', 'infra/restart-sentinel.ts',
  'infra/dotenv.ts', 'infra/fs-safe.ts',

  // PROCESS
  'process/exec.ts', 'process/command-queue.ts', 'process/lanes.ts',

  // GATEWAY
  'gateway/call.ts', 'gateway/session-utils.ts',

  // MEDIA
  'media/image-ops.ts',

  // AGENTS
  'agents/bash-process-registry.ts', 'agents/shell-utils.ts',
  'agents/pty-dsr.ts', 'agents/pty-keys.ts', 'agents/apply-patch.ts',
  'agents/defaults.ts', 'agents/types.ts', 'agents/context.ts',
  'agents/model-catalog.ts', 'agents/agent-paths.ts', 'agents/docs-path.ts',
  'agents/context-window-guard.ts', 'agents/usage.ts',
  'agents/pi-settings.ts', 'agents/images.ts', 'agents/compact.ts',
  'agents/pi-embedded-helpers.ts', 'agents/pi-embedded-utils.ts',
  'agents/pi-embedded.ts', 'agents/pi-embedded-runner.ts',
  'agents/pi-embedded-runner/google.ts',
  'agents/pi-embedded-helpers/google.ts',
  'agents/pi-embedded-subscribe.handlers.ts',
  'agents/pi-embedded-subscribe.handlers.types.ts',
  'agents/pi-embedded-subscribe.raw-stream.ts',
  'agents/registry.ts',
  'agents/schema/typebox.ts',
  'agents/tool-display.json',

  // AUTO-REPLY
  'auto-reply/thinking.ts', 'auto-reply/tokens.ts', 'auto-reply/tool-meta.ts',
  'auto-reply/reply/queue.ts', 'auto-reply/heartbeat.ts',

  // SESSIONS
  'sessions/model-overrides.ts',

  // UTILS
  'utils/delivery-context.ts', 'utils/message-channel.ts',

  // ROUTING
  'routing/session-key.ts',

  // CLI
  'cli/command-format.ts',

  // AGENTS RUN
  'agents/run/params.ts', 'agents/run/payloads.ts',

  // SANDBOX
  'agents/sandbox/context.ts', 'agents/sandbox/docker.ts', 'agents/sandbox/manage.ts',
];

let copied = 0, existed = 0, missing = 0;
for (const f of files) {
  const result = copyIfExists(f);
  if (result === 'copied') copied++;
  else if (result === 'exists') existed++;
  else missing++;
}

console.log(`\nDone. Copied: ${copied}, Existed: ${existed}, Missing: ${missing}`);
