import subprocess, os, re, shutil

SOURCE = 'C:/Users/User_DAIP/Work/Transcribe/Code/openclaw'
TARGET = 'C:/Users/User_DAIP/Work/Transcribe/Code/openclaw-agent'

# EXCLUDED categories - files we will NOT copy (boundary leaves)
EXCLUDED_PATTERNS = [
    # Channels/Messaging
    'src/channels/dock',
    'src/channels/plugins/allowlist-match',
    'src/channels/plugins/channel-config',
    'src/channels/plugins/directory-config',
    'src/channels/plugins/message-action-names',
    'src/channels/plugins/types.adapters',
    'src/channels/plugins/types.core',
    'src/channels/plugins/types.plugin',
    'src/telegram/',
    'src/signal/',
    # TUI / CLI
    'src/tui/',
    'src/terminal/',
    'src/cli/',
    # TTS
    'src/media/audio',
    # Docker/sandbox lifecycle
    'src/agents/sandbox/context',
    'src/agents/sandbox/docker',
    'src/agents/sandbox/manage',
    # Gateway server (we don't run the gateway server)
    'src/gateway/client',
    'src/gateway/protocol/',
    'src/gateway/server-methods/',
    'src/gateway/session-utils.fs',
    'src/gateway/session-utils.types',
    # Plugin discovery/loading
    'src/plugins/discovery',
    'src/plugins/http-path',
    'src/plugins/loader',
    'src/plugins/manifest',
    'src/plugins/runtime/types',
    'src/plugins/schema-validator',
    'src/plugins/slots',
    'src/plugins/commands',
    # Daemon
    'src/daemon/',
    # Infra that depends on excluded subsystems
    'src/infra/tailnet',
    'src/infra/tls/gateway',
    'src/infra/device-identity',
    'src/infra/outbound/channel-target',
    # Media understanding (needs sharp)
    'src/media-understanding/',
    'src/media/fetch',
    'src/media/parse',
    # Auto-reply subsystems that reach into channels
    'src/auto-reply/route-reply',
    'src/auto-reply/directives',
    'src/auto-reply/reply/typing',
    'src/auto-reply/talk',
    # Provider-specific OAuth / discovery
    'src/providers/qwen-portal-oauth',
    'src/agents/chutes-oauth',
    'src/agents/bedrock-discovery',
    'src/agents/venice-models',
    'src/agents/synthetic-models',
    # External CLI sync
    'src/agents/external-cli-sync',
    # Provider usage auth/fetch (needs gateway)
    'src/infra/provider-usage.auth',
    'src/infra/provider-usage.fetch',
]

def is_excluded(path):
    for pat in EXCLUDED_PATTERNS:
        if pat in path:
            return True
    return False

def get_needed_files():
    result = subprocess.run('npx tsc --noEmit', capture_output=True, text=True, cwd=TARGET, shell=True)
    errors = result.stdout + result.stderr

    needed = set()
    for line in errors.split('\n'):
        m = re.match(r"(.+?)\(\d+,\d+\): error TS2307: Cannot find module '(.+?)'", line)
        if not m:
            continue
        importing_file = m.group(1).replace(os.sep, '/')
        module = m.group(2)
        if not module.startswith('.'):
            continue
        dir_of_importer = os.path.dirname(importing_file)
        resolved = os.path.normpath(os.path.join(dir_of_importer, module)).replace(os.sep, '/')
        resolved = resolved.replace('.js', '.ts')
        needed.add(resolved)
    return needed

# Iterate: copy → compile → check → copy more
round_num = 0
total_copied = []
total_excluded = []

while True:
    round_num += 1
    needed = get_needed_files()

    to_copy = []
    excluded = []
    for f in sorted(needed):
        target_path = os.path.join(TARGET, f)
        if os.path.isfile(target_path):
            continue  # already exists in target
        if is_excluded(f):
            excluded.append(f)
            continue
        src = os.path.join(SOURCE, f)
        if os.path.isfile(src):
            to_copy.append(f)
        else:
            print(f'  SOURCE NOT FOUND: {f}')

    if not to_copy:
        print(f'\nRound {round_num}: No more files to copy.')
        total_excluded.extend(excluded)
        break

    print(f'\nRound {round_num}: Copying {len(to_copy)} files...')
    for f in to_copy:
        src = os.path.join(SOURCE, f)
        dst = os.path.join(TARGET, f)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(src, dst)
        print(f'  + {f}')

    total_copied.extend(to_copy)
    total_excluded.extend(excluded)

# Dedupe excluded list
total_excluded = sorted(set(total_excluded))

print(f'\n=== SUMMARY ===')
print(f'Total copied: {len(total_copied)}')
print(f'Total excluded (boundary): {len(total_excluded)}')
for f in total_excluded:
    print(f'  EXCL: {f}')
