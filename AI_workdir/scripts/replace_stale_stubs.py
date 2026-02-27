import shutil, os

SOURCE = 'C:/Users/User_DAIP/Work/Transcribe/Code/openclaw'
TARGET = 'C:/Users/User_DAIP/Work/Transcribe/Code/openclaw-agent'

# Files that exist in target but are incomplete stubs — need full originals
STALE_STUBS = [
    'src/agents/pi-embedded-helpers/bootstrap.ts',
    'src/agents/pi-embedded-runner/types.ts',
    'src/agents/pi-embedded-subscribe.handlers.types.ts',
    'src/agents/pi-embedded-subscribe.tools.ts',
    'src/auto-reply/tokens.ts',
    'src/channels/registry.ts',
    'src/config/sessions.ts',
    'src/config/sessions/types.ts',
    'src/plugins/types.ts',
    'src/runtime.ts',
]

for f in STALE_STUBS:
    src = os.path.join(SOURCE, f)
    dst = os.path.join(TARGET, f)
    if os.path.isfile(src):
        shutil.copy2(src, dst)
        print(f'REPLACED: {f}')
    else:
        print(f'SOURCE NOT FOUND: {f}')
