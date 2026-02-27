import subprocess, os, re

result = subprocess.run('npx tsc --noEmit', capture_output=True, text=True, cwd='.', shell=True)
errors = result.stdout + result.stderr

needed = set()
for line in errors.split('\n'):
    m = re.match(r"(.+?)\(\d+,\d+\): error TS2307: Cannot find module '(.+?)'", line)
    if not m:
        continue
    importing_file = m.group(1).replace(os.sep, '/')
    module = m.group(2)
    if not module.startswith('.'):
        print(f'SKIP_NPM: {module}')
        continue
    dir_of_importer = os.path.dirname(importing_file)
    resolved = os.path.normpath(os.path.join(dir_of_importer, module)).replace(os.sep, '/')
    resolved = resolved.replace('.js', '.ts')
    needed.add(resolved)

for f in sorted(needed):
    orig = os.path.join('C:/Users/User_DAIP/Work/Transcribe/Code/openclaw', f)
    exists = os.path.isfile(orig)
    print(f'{"EXISTS" if exists else "MISSING"}: {f}')

print(f'\nTotal needed: {len(needed)}')
print(f'Existing: {sum(1 for f in needed if os.path.isfile(os.path.join("C:/Users/User_DAIP/Work/Transcribe/Code/openclaw", f)))}')
