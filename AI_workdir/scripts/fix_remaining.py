#!/usr/bin/env python3
import subprocess, re, os, sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MAX_ITERATIONS = 5

def run_tsc():
    result = subprocess.run("npx tsc --noEmit", shell=True, cwd=str(ROOT), capture_output=True, text=True, timeout=180)
    return result.returncode, result.stdout + chr(10) + result.stderr

def parse_errors(output):
    errors = []
    pat = r"^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)$"
    for m in re.finditer(pat, output, re.MULTILINE):
        errors.append({"file": m.group(1).strip(), "line": int(m.group(2)), "col": int(m.group(3)), "code": m.group(4), "message": m.group(5).strip()})
    return errors