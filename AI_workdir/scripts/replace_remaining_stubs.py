import shutil, os

SOURCE = 'C:/Users/User_DAIP/Work/Transcribe/Code/openclaw'
TARGET = 'C:/Users/User_DAIP/Work/Transcribe/Code/openclaw-agent'

STUBS = [
    'src/agents/pi-embedded-runner/run/params.ts',
    'src/agents/pi-embedded-runner/run/types.ts',
    'src/config/sessions/main-session.ts',
    'src/config/sessions/metadata.ts',
    'src/config/sessions/reset.ts',
    'src/config/sessions/session-key.ts',
    'src/config/sessions/store.ts',
    'src/config/sessions/transcript.ts',
    'src/config/zod-schema.ts',
    'src/hooks/hooks.ts',
    'src/logging/subsystem.ts',
]

for f in STUBS:
    src = os.path.join(SOURCE, f)
    dst = os.path.join(TARGET, f)
    if os.path.isfile(src):
        shutil.copy2(src, dst)
        print(f'REPLACED: {f}')
    else:
        print(f'SOURCE NOT FOUND: {f}')
