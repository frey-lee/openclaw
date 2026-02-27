"""Phase 4: Prune at boundary leaves.

For each TS2307 (missing module) error:
1. Find the complete import statement (may span multiple lines)
2. Comment out the entire import block
3. Add type shims for npm modules

This properly handles multi-line imports like:
  import {
    foo,
    bar,
  } from './module.js';
"""
import subprocess, os, re
from collections import defaultdict

TARGET = 'C:/Users/User_DAIP/Work/Transcribe/Code/openclaw-agent'

def get_ts2307_errors():
    result = subprocess.run('npx tsc --noEmit', capture_output=True, text=True, cwd=TARGET, shell=True)
    errors = result.stdout + result.stderr
    missing = []
    for line in errors.split('\n'):
        m = re.match(r"(.+?)\((\d+),\d+\): error TS2307: Cannot find module '(.+?)'", line)
        if m:
            missing.append((m.group(1).replace(os.sep, '/'), int(m.group(2)), m.group(3)))
    return missing

def find_import_range(lines, start_line_1based):
    """Find the start and end indices (0-based) of a complete import statement."""
    idx = start_line_1based - 1
    if idx >= len(lines):
        return None, None

    # Check if this line contains 'import' or 'export'
    line = lines[idx]

    # Find the start: walk backwards if this line doesn't start with import/export
    start = idx
    while start > 0:
        stripped = lines[start].lstrip()
        if stripped.startswith('import ') or stripped.startswith('export ') or stripped.startswith('import{') or stripped.startswith('export{'):
            break
        # If it's a continuation line (doesn't start with import/export but previous one does)
        start -= 1

    # Now find the end: walk forward until we find a line ending with ';' or the from clause
    end = start
    while end < len(lines):
        line_text = lines[end].rstrip()
        # Check if the statement is complete
        if line_text.endswith(';') or line_text.endswith(';'):
            break
        # Also check for: from '...'  (without semicolon)
        if re.search(r"""from\s+['"].*['"]""", line_text):
            break
        end += 1

    return start, min(end, len(lines) - 1)

def comment_out_lines(lines, start, end):
    """Comment out lines[start:end+1]."""
    for i in range(start, end + 1):
        if not lines[i].lstrip().startswith('//'):
            lines[i] = '// [pruned] ' + lines[i]

# Get errors
missing_imports = get_ts2307_errors()
by_file = defaultdict(set)
for f, ln, mod in missing_imports:
    by_file[f].add((ln, mod))

npm_modules = set()
files_changed = 0

for filepath, entries in sorted(by_file.items()):
    full_path = os.path.join(TARGET, filepath)
    if not os.path.isfile(full_path):
        continue

    with open(full_path, 'r', encoding='utf-8') as fh:
        lines = fh.readlines()

    ranges_to_comment = set()
    for ln, mod in entries:
        if not mod.startswith('.'):
            npm_modules.add(mod)

        start, end = find_import_range(lines, ln)
        if start is not None:
            for i in range(start, end + 1):
                ranges_to_comment.add(i)

    if ranges_to_comment:
        for i in sorted(ranges_to_comment):
            if i < len(lines) and not lines[i].lstrip().startswith('//'):
                lines[i] = '// [pruned] ' + lines[i]

        with open(full_path, 'w', encoding='utf-8') as fh:
            fh.writelines(lines)
        files_changed += 1
        print(f'  PRUNED {len(ranges_to_comment)} line(s) in: {filepath}')

print(f'\nFiles changed: {files_changed}')
print(f'\nNPM modules that need declare statements: {sorted(npm_modules)}')

# Create ambient declarations for npm modules
if npm_modules:
    decl_path = os.path.join(TARGET, 'src', 'ambient.d.ts')
    with open(decl_path, 'w', encoding='utf-8') as fh:
        fh.write('// Ambient module declarations for pruned npm dependencies\n')
        for mod in sorted(npm_modules):
            fh.write(f'declare module "{mod}";\n')
    print(f'\nCreated {decl_path} with {len(npm_modules)} declarations')
