import subprocess, os, re

result = subprocess.run('npx tsc --noEmit', capture_output=True, text=True, cwd='.', shell=True)
errors = result.stdout + result.stderr

files_needing_exports = set()
for line in errors.split('\n'):
    # TS2305: Module '"./foo.js"' has no exported member 'Bar'.
    # TS2724: '"./foo.js"' has no exported member named 'Bar'. Did you mean 'Baz'?
    # TS2614: Module '"./foo.js"' has no exported member 'Bar'. Did you mean to use import ... instead?
    m = re.search(r"""['"](\./.+?|\.\./.+?)['"].*has no exported member""", line)
    if not m:
        continue
    # Get importing file
    m2 = re.match(r'(.+?)\(\d+,\d+\):', line)
    if not m2:
        continue
    imp_file = m2.group(1).replace(os.sep, '/')
    mod = m.group(1)
    d = os.path.dirname(imp_file)
    resolved = os.path.normpath(os.path.join(d, mod)).replace(os.sep, '/')
    resolved = resolved.replace('.js', '.ts')

    # Get the missing member name
    m3 = re.search(r"has no exported member (?:named )?'(\w+)'", line)
    member = m3.group(1) if m3 else '?'

    files_needing_exports.add((resolved, member, imp_file))

# Group by file
by_file = {}
for resolved, member, imp_file in sorted(files_needing_exports):
    if resolved not in by_file:
        by_file[resolved] = []
    by_file[resolved].append((member, imp_file))

for f in sorted(by_file):
    orig = os.path.join('C:/Users/User_DAIP/Work/Transcribe/Code/openclaw', f)
    exists_in_target = os.path.isfile(f)
    exists_in_source = os.path.isfile(orig)
    print(f'\n{f} (in target: {exists_in_target}, in source: {exists_in_source})')
    for member, imp_file in by_file[f]:
        print(f'  missing: {member} (imported by: {imp_file})')
