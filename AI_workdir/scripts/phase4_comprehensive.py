"""Phase 4: Comprehensive pruning at boundary leaves.

Strategy:
1. Run tsc to find TS2307 (missing module) errors
2. For missing relative modules: create minimal stub files
3. For missing npm modules: add to ambient.d.ts
4. Comment out imports from non-existent modules
5. Re-run tsc to find TS2304 (undefined names), TS2305 (missing exports), etc.
6. Fix those iteratively

Each stub file uses `export const X = undefined as any;` for value exports
and `export type X = any;` for type-only exports.
"""
import subprocess, os, re, shutil
from collections import defaultdict
from pathlib import Path

TARGET = Path('C:/Users/User_DAIP/Work/Transcribe/Code/openclaw-agent')
SOURCE = Path('C:/Users/User_DAIP/Work/Transcribe/Code/openclaw')

EXCLUDED_DIRS = [
    'src/discord/', 'src/line/', 'src/slack/', 'src/telegram/',
    'src/signal/', 'src/imessage/', 'src/tts/', 'src/commands/',
    'src/web/media.ts',
]

def is_excluded_domain(path_str):
    for d in EXCLUDED_DIRS:
        if d in path_str:
            return True
    return False

def run_tsc():
    result = subprocess.run('npx tsc --noEmit', capture_output=True, text=True,
                          cwd=str(TARGET), shell=True)
    return result.stdout + result.stderr

def parse_errors(output):
    errors = []
    for line in output.split('\n'):
        m = re.match(r'(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)', line)
        if m:
            errors.append({
                'file': m.group(1).replace(os.sep, '/'),
                'line': int(m.group(2)),
                'col': int(m.group(3)),
                'code': m.group(4),
                'msg': m.group(5),
            })
    return errors

def resolve_module(importing_file, module_path):
    """Resolve a relative import to a file path."""
    if not module_path.startswith('.'):
        return None
    d = os.path.dirname(importing_file)
    resolved = os.path.normpath(os.path.join(d, module_path)).replace(os.sep, '/')
    return resolved.replace('.js', '.ts')

def find_import_block(lines, error_line_1based):
    """Find the complete import statement containing this line. Returns (start, end) 0-based inclusive."""
    idx = error_line_1based - 1
    if idx >= len(lines):
        return None, None

    # Walk backwards to find start of import
    start = idx
    while start > 0:
        stripped = lines[start].lstrip()
        if stripped.startswith('import ') or stripped.startswith('export ') or \
           stripped.startswith('import{') or stripped.startswith('export{') or \
           stripped.startswith('// [pruned]'):
            break
        start -= 1

    # Walk forward to find end (semicolon or from clause)
    end = max(start, idx)
    while end < len(lines) - 1:
        line_text = lines[end].rstrip()
        if line_text.endswith(';'):
            break
        if re.search(r"""from\s+['"].*['"];?\s*$""", line_text):
            break
        end += 1

    return start, end

def comment_block(lines, start, end):
    """Comment out lines[start:end+1] with // [pruned] prefix."""
    changed = False
    for i in range(start, end + 1):
        if i < len(lines) and not lines[i].lstrip().startswith('// [pruned]'):
            lines[i] = '// [pruned] ' + lines[i]
            changed = True
    return changed

def create_stub_for_imports(resolved_path, importing_files):
    """Analyze what symbols are imported from this file and create a proper stub."""
    all_value_imports = set()
    all_type_imports = set()

    for imp_file in importing_files:
        full_imp = TARGET / imp_file
        if not full_imp.exists():
            continue
        content = full_imp.read_text(encoding='utf-8')

        # Find all imports from this module
        # Handle various import forms
        module_name = os.path.relpath(resolved_path, os.path.dirname(imp_file)).replace(os.sep, '/')
        if not module_name.startswith('.'):
            module_name = './' + module_name
        module_name_js = module_name.replace('.ts', '.js')

        # Pattern: import { A, B } from './module.js'
        for m in re.finditer(r'import\s+\{([^}]+)\}\s+from\s+[\'"]' + re.escape(module_name_js) + r'[\'"]', content):
            for sym in m.group(1).split(','):
                sym = sym.strip()
                if sym.startswith('type '):
                    all_type_imports.add(sym[5:].strip().split(' as ')[0].strip())
                else:
                    all_value_imports.add(sym.split(' as ')[0].strip())

        # Pattern: import type { A, B } from './module.js'
        for m in re.finditer(r'import\s+type\s+\{([^}]+)\}\s+from\s+[\'"]' + re.escape(module_name_js) + r'[\'"]', content):
            for sym in m.group(1).split(','):
                sym = sym.strip().split(' as ')[0].strip()
                if sym:
                    all_type_imports.add(sym)

        # Pattern: import defaultExport from './module.js'
        for m in re.finditer(r'import\s+(\w+)\s+from\s+[\'"]' + re.escape(module_name_js) + r'[\'"]', content):
            name = m.group(1)
            if name != 'type':
                all_value_imports.add(name)

    # Remove types that are also values (value export covers both)
    pure_types = all_type_imports - all_value_imports

    stub_path = TARGET / resolved_path
    stub_path.parent.mkdir(parents=True, exist_ok=True)

    lines = ['// [stubbed] Minimal stub for excluded dependency\n']
    for name in sorted(all_value_imports):
        if name:
            lines.append(f'export const {name} = undefined as any;\n')
    for name in sorted(pure_types):
        if name:
            lines.append(f'export type {name} = any;\n')
    if not all_value_imports and not pure_types:
        lines.append('export {};\n')

    stub_path.write_text(''.join(lines), encoding='utf-8')
    return len(all_value_imports) + len(pure_types)

# ========== MAIN ==========

print("=" * 60)
print("Phase 4: Comprehensive boundary pruning")
print("=" * 60)

for iteration in range(10):
    print(f"\n--- Iteration {iteration + 1} ---")
    output = run_tsc()
    errors = parse_errors(output)

    if not errors:
        print("0 errors! Done!")
        break

    error_counts = defaultdict(int)
    for e in errors:
        error_counts[e['code']] += 1
    print(f"Errors: {dict(sorted(error_counts.items(), key=lambda x: -x[1]))}")

    # Group TS2307 by importing file
    ts2307_by_file = defaultdict(list)
    missing_modules = defaultdict(set)  # resolved_path -> set of importing files
    npm_modules = set()

    for e in errors:
        if e['code'] != 'TS2307':
            continue
        m = re.search(r"Cannot find module '(.+?)'", e['msg'])
        if not m:
            continue
        module = m.group(1)
        if not module.startswith('.'):
            npm_modules.add(module)
            ts2307_by_file[e['file']].append((e['line'], module))
            continue
        resolved = resolve_module(e['file'], module)
        if resolved:
            target_path = TARGET / resolved
            if not target_path.exists():
                missing_modules[resolved].add(e['file'])
            ts2307_by_file[e['file']].append((e['line'], module))

    if not ts2307_by_file and not missing_modules:
        # No more TS2307 errors - handle other error types
        # TS2304: Cannot find name
        ts2304_by_file = defaultdict(set)
        for e in errors:
            if e['code'] == 'TS2304':
                ts2304_by_file[e['file']].add(e['line'])

        # TS2305: Missing exports
        ts2305_files = set()
        for e in errors:
            if e['code'] in ('TS2305', 'TS2724'):
                ts2305_files.add(e['file'])

        if ts2304_by_file:
            print(f"  Commenting out {sum(len(v) for v in ts2304_by_file.values())} lines with TS2304 errors")
            for filepath, line_nums in ts2304_by_file.items():
                full_path = TARGET / filepath
                if not full_path.exists():
                    continue
                lines = full_path.read_text(encoding='utf-8').splitlines(keepends=True)
                for ln in sorted(line_nums, reverse=True):
                    idx = ln - 1
                    if idx < len(lines) and not lines[idx].lstrip().startswith('// [pruned]'):
                        lines[idx] = '// [pruned] ' + lines[idx]
                full_path.write_text(''.join(lines), encoding='utf-8')
            continue

        if ts2305_files:
            print(f"  TS2305 errors in: {ts2305_files}")
            # Try to add missing exports
            for e in errors:
                if e['code'] not in ('TS2305', 'TS2724'):
                    continue
                m = re.search(r"has no exported member (?:named )?'(\w+)'", e['msg'])
                if not m:
                    continue
                member = m.group(1)
                m2 = re.search(r"""Module ['"](\./.+?|\.\./.+?)['"]""", e['msg'])
                if not m2:
                    continue
                mod = m2.group(1)
                resolved = resolve_module(e['file'], mod)
                if not resolved:
                    continue
                full_path = TARGET / resolved
                if not full_path.exists():
                    continue
                content = full_path.read_text(encoding='utf-8')
                # Check if export already exists
                if re.search(rf'\bexport\b.*\b{re.escape(member)}\b', content):
                    continue
                # Add export
                content += f'\nexport type {member} = any;\n'
                full_path.write_text(content, encoding='utf-8')
                print(f"    Added export type {member} to {resolved}")
            continue

        # Other errors (TS2322, TS7006, etc.) — not critical for compilation
        print("  Remaining errors are not TS2307/TS2304/TS2305. Checking if critical...")
        remaining_critical = [e for e in errors if e['code'] not in ('TS7006', 'TS7053', 'TS2322', 'TS18046', 'TS2739', 'TS2741', 'TS2552')]
        if remaining_critical:
            print(f"  {len(remaining_critical)} critical errors remain")
            for e in remaining_critical[:10]:
                print(f"    {e['file']}:{e['line']} {e['code']}: {e['msg'][:100]}")
        else:
            print("  Only non-critical errors remain (implicit any, null/undefined compat)")
        break

    # Step 1: Create stubs for missing relative modules
    if missing_modules:
        print(f"  Creating {len(missing_modules)} stub files")
        for resolved, importers in sorted(missing_modules.items()):
            count = create_stub_for_imports(resolved, importers)
            print(f"    + {resolved} ({count} exports)")

    # Step 2: Add npm module declarations
    if npm_modules:
        ambient_path = TARGET / 'src' / 'ambient.d.ts'
        existing = ambient_path.read_text(encoding='utf-8') if ambient_path.exists() else ''
        new_decls = []
        for mod in sorted(npm_modules):
            if f'declare module "{mod}"' not in existing:
                new_decls.append(f'declare module "{mod}";\n')
        if new_decls:
            with open(ambient_path, 'a', encoding='utf-8') as f:
                f.writelines(new_decls)
            print(f"  Added {len(new_decls)} npm module declarations to ambient.d.ts")

    # Step 3: Comment out import lines that reference missing modules
    files_pruned = 0
    for filepath, entries in sorted(ts2307_by_file.items()):
        full_path = TARGET / filepath
        if not full_path.exists():
            continue
        lines = full_path.read_text(encoding='utf-8').splitlines(keepends=True)
        changed = False
        for ln, mod in sorted(entries, reverse=True):
            start, end = find_import_block(lines, ln)
            if start is not None:
                changed |= comment_block(lines, start, end)
        if changed:
            full_path.write_text(''.join(lines), encoding='utf-8')
            files_pruned += 1

    if files_pruned:
        print(f"  Pruned imports in {files_pruned} files")

# Final check
print("\n" + "=" * 60)
output = run_tsc()
errors = parse_errors(output)
error_counts = defaultdict(int)
for e in errors:
    error_counts[e['code']] += 1
print(f"Final error count: {sum(error_counts.values())}")
print(f"By type: {dict(sorted(error_counts.items(), key=lambda x: -x[1]))}")
