"""Find all files in the agent that are significantly smaller than their originals."""
import os

SOURCE = 'C:/Users/User_DAIP/Work/Transcribe/Code/openclaw/src'
TARGET = 'C:/Users/User_DAIP/Work/Transcribe/Code/openclaw-agent/src'

stubs = []
for root, dirs, files in os.walk(TARGET):
    for f in files:
        if not f.endswith('.ts'):
            continue
        target_path = os.path.join(root, f)
        rel = os.path.relpath(target_path, TARGET).replace(os.sep, '/')
        source_path = os.path.join(SOURCE, rel)

        if not os.path.isfile(source_path):
            continue

        target_size = os.path.getsize(target_path)
        source_size = os.path.getsize(source_path)

        # If target is less than 30% of source size, it's probably a stub
        if source_size > 200 and target_size < source_size * 0.3:
            stubs.append((rel, target_size, source_size))

stubs.sort()
print(f'Found {len(stubs)} likely stubs:')
for rel, ts, ss in stubs:
    print(f'  {rel}: target={ts}b, source={ss}b ({ts*100//ss}%)')
