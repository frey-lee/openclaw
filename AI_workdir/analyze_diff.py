import re
import os

base = "C:/Users/User_DAIP/Work/Transcribe/Code/openclaw/AI_workdir"

with open(os.path.join(base, "original_run.ts"), "r", encoding="utf-8") as f:
    orig_lines = f.readlines()

with open(os.path.join(base, "agent_run.ts"), "r", encoding="utf-8") as f:
    agent_content = f.read()

deleted_lines = []
commented_lines = []
present_lines = []
trivial_lines = []

trivial_set = {'', '{', '}', '});', ')', ');', '(', '},', '],', '})', '} finally {',
               'try {', 'while (true) {', '} catch (err) {', 'break;', 'continue;'}

for i, line in enumerate(orig_lines, 1):
    stripped = line.rstrip('\n').strip()
    
    if stripped in trivial_set or (len(stripped) <= 2 and not stripped.isalnum()):
        trivial_lines.append((i, stripped))
        continue
    
    # Check if line exists as-is in agent file
    if stripped in agent_content:
        present_lines.append((i, stripped))
        continue
    
    # Check various comment forms
    found_as_comment = False
    for prefix in ['// ', '//   ', '//  ', '//    ', '//     ', '//      ', '//       ']:
        if (prefix + stripped) in agent_content:
            found_as_comment = True
            break
    
    if not found_as_comment:
        # Also try: the content might be in a summarized comment block like "// ... { ... }"
        # or the stripped content minus leading/trailing might match
        bare = stripped.lstrip()
        for prefix in ['// ', '//   ', '//  ', '//    ']:
            if (prefix + bare) in agent_content:
                found_as_comment = True
                break
    
    if found_as_comment:
        commented_lines.append((i, stripped))
        continue
    
    deleted_lines.append((i, stripped))

print(f"Total original lines: {len(orig_lines)}")
print(f"Trivial (braces/blank/control): {len(trivial_lines)}")
print(f"Present as-is in agent: {len(present_lines)}")
print(f"Commented out in agent: {len(commented_lines)}")
print(f"TRULY DELETED (not found as code or comment): {len(deleted_lines)}")
print()
print("=== TRULY DELETED LINES (not commented out, not present) ===")
for linenum, content in deleted_lines:
    print(f"  L{linenum}: {content}")
