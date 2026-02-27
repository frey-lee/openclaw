"""Phase 4: Fix all remaining compilation errors.

Strategy:
1. For files in excluded domain directories (discord, slack, line, telegram, signal,
   imessage, tts, web/media, commands, markdown) — replace with minimal stubs
2. For core files — comment out problematic code and add type shims
"""
import subprocess, os, re
from collections import defaultdict

TARGET = 'C:/Users/User_DAIP/Work/Transcribe/Code/openclaw-agent'

# Domains that should be entirely stubbed out
EXCLUDED_DIRS = [
    'src/discord/',
    'src/line/',
    'src/slack/',
    'src/telegram/',
    'src/signal/',
    'src/imessage/',
    'src/tts/',
    'src/commands/',
    'src/markdown/',
]

def is_excluded_domain(filepath):
    fp = filepath.replace(os.sep, '/')
    for d in EXCLUDED_DIRS:
        if d in fp:
            return True
    return False

def get_all_errors():
    result = subprocess.run('npx tsc --noEmit', capture_output=True, text=True, cwd=TARGET, shell=True)
    return result.stdout + result.stderr

def parse_errors(error_text):
    """Parse all errors, grouped by file."""
    by_file = defaultdict(list)
    for line in error_text.split('\n'):
        m = re.match(r'(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)', line)
        if m:
            by_file[m.group(1).replace(os.sep, '/')].append({
                'line': int(m.group(2)),
                'col': int(m.group(3)),
                'code': m.group(4),
                'msg': m.group(5),
            })
    return by_file

def find_exports_from_file(filepath):
    """Find all exported symbols from a file."""
    full_path = os.path.join(TARGET, filepath)
    if not os.path.isfile(full_path):
        return set()
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()

    exports = set()
    # export function foo
    for m in re.finditer(r'export\s+(?:async\s+)?function\s+(\w+)', content):
        exports.add(m.group(1))
    # export const/let/var foo
    for m in re.finditer(r'export\s+(?:const|let|var)\s+(\w+)', content):
        exports.add(m.group(1))
    # export type/interface foo
    for m in re.finditer(r'export\s+(?:type|interface|enum|class)\s+(\w+)', content):
        exports.add(m.group(1))
    # export { foo, bar }
    for m in re.finditer(r'export\s*\{([^}]+)\}', content):
        for name in m.group(1).split(','):
            name = name.strip().split(' as ')[0].strip()
            if name:
                exports.add(name)
    return exports

def stub_file(filepath, needed_exports=None):
    """Replace a file with a minimal stub that exports empty symbols."""
    full_path = os.path.join(TARGET, filepath)

    # Find what this file currently exports
    if needed_exports is None:
        needed_exports = find_exports_from_file(filepath)

    # Build stub content
    lines = [f'// [stubbed] Original file from excluded domain\n']
    for name in sorted(needed_exports):
        # We don't know if it's a type, function, or const — use a safe pattern
        lines.append(f'export const {name} = undefined as any;\n')

    if not needed_exports:
        lines.append('export {};\n')

    with open(full_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)

# Step 1: Find what's imported from excluded domain files
print("=== Finding imports from excluded domains ===")

# Walk all .ts files and find what they import from excluded domains
import_map = defaultdict(set)  # excluded_file -> set of imported symbols

for root, dirs, files in os.walk(os.path.join(TARGET, 'src')):
    for fname in files:
        if not fname.endswith('.ts'):
            continue
        fpath = os.path.join(root, fname)
        rel = os.path.relpath(fpath, TARGET).replace(os.sep, '/')

        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Find imports
        for m in re.finditer(r'''import\s+(?:type\s+)?(?:\{([^}]+)\}|(\w+))\s+from\s+['"]([^'"]+)['"]''', content):
            named = m.group(1)
            default_name = m.group(2)
            module = m.group(3)

            if not module.startswith('.'):
                continue

            # Resolve to absolute path
            dir_of_file = os.path.dirname(rel)
            resolved = os.path.normpath(os.path.join(dir_of_file, module)).replace(os.sep, '/')
            resolved = resolved.replace('.js', '.ts')

            if is_excluded_domain(resolved):
                if named:
                    for sym in named.split(','):
                        sym = sym.strip().split(' as ')[0].strip()
                        if sym:
                            import_map[resolved].add(sym)
                if default_name:
                    import_map[resolved].add(default_name)

print(f"Found {len(import_map)} excluded domain files that are imported")
for f, syms in sorted(import_map.items()):
    print(f"  {f}: {sorted(syms)}")

# Step 2: Stub out excluded domain files
print("\n=== Stubbing excluded domain files ===")
stubbed = 0
for filepath, symbols in sorted(import_map.items()):
    full_path = os.path.join(TARGET, filepath)
    if os.path.isfile(full_path):
        stub_file(filepath, symbols)
        print(f"  STUBBED: {filepath} ({len(symbols)} exports)")
        stubbed += 1

print(f"\nStubbed {stubbed} files")
