/**
 * Fix missing exports in stub files and barrel re-export chains.
 *
 * This script:
 * 1. Runs tsc and collects TS2305/TS2724 errors (missing exports).
 * 2. For each error, determines what symbol is missing from which module.
 * 3. If the module is a barrel file (export * from ...), traces the chain
 *    and adds the missing export to the appropriate sub-module stub.
 * 4. If the module is a direct stub, adds the missing export directly.
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd());
const STUB_MARKER = "// Auto-generated stub file";

console.log("Running tsc --noEmit …");
let tscOutput;
try {
  tscOutput = execSync("npx tsc --noEmit 2>&1", {
    cwd: ROOT,
    encoding: "utf-8",
    maxBuffer: 50 * 1024 * 1024,
  });
} catch (err) {
  tscOutput = err.stdout || err.output?.join("") || "";
}

// Parse TS2305 errors: Module '"path"' has no exported member 'Name'.
// Parse TS2724 errors: '"path"' has no exported member named 'Name'. Did you mean 'Other'?
const missingExports = new Map(); // targetAbsPath → Set<symbolName>

// TS2305
const ts2305Re =
  /^(.+?)\(\d+,\d+\): error TS2305: Module '"(\.\.?[^"]+)"' has no exported member '(\w+)'/gm;
let match;
while ((match = ts2305Re.exec(tscOutput)) !== null) {
  const importingFileRel = match[1].replace(/\\/g, "/");
  const moduleSpecifier = match[2];
  const symbolName = match[3];

  const importingFileAbs = path.resolve(ROOT, importingFileRel);
  const importingDir = path.dirname(importingFileAbs);
  let targetPath = path.resolve(importingDir, moduleSpecifier);
  if (targetPath.endsWith(".js")) targetPath = targetPath.slice(0, -3) + ".ts";

  if (!missingExports.has(targetPath)) {
    missingExports.set(targetPath, new Set());
  }
  missingExports.get(targetPath).add(symbolName);
}

// TS2724: '"path"' has no exported member named 'Name'. Did you mean 'Other'?
const ts2724Re =
  /^(.+?)\(\d+,\d+\): error TS2724: '"(\.\.?[^"]+)"' has no exported member named '(\w+)'/gm;
while ((match = ts2724Re.exec(tscOutput)) !== null) {
  const importingFileRel = match[1].replace(/\\/g, "/");
  const moduleSpecifier = match[2];
  const symbolName = match[3];

  const importingFileAbs = path.resolve(ROOT, importingFileRel);
  const importingDir = path.dirname(importingFileAbs);
  let targetPath = path.resolve(importingDir, moduleSpecifier);
  if (targetPath.endsWith(".js")) targetPath = targetPath.slice(0, -3) + ".ts";

  if (!missingExports.has(targetPath)) {
    missingExports.set(targetPath, new Set());
  }
  missingExports.get(targetPath).add(symbolName);
}

console.log(`Found ${missingExports.size} modules with missing exports.`);

/**
 * For a barrel file that does `export * from './sub.js'`, find all re-export targets.
 */
function findReExportTargets(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, "utf-8");
  const targets = [];
  const re = /export\s+\*\s+from\s+['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    let target = path.resolve(path.dirname(filePath), m[1]);
    if (target.endsWith(".js")) target = target.slice(0, -3) + ".ts";
    targets.push(target);
  }
  return targets;
}

/**
 * Check if a file is a barrel file (only has `export * from` lines).
 */
function isBarrelFile(filePath) {
  if (!fs.existsSync(filePath)) return false;
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
  return lines.length > 0 && lines.every((l) => /^export\s+\*\s+from\s+/.test(l));
}

function classifySymbol(name) {
  if (/^[A-Z][A-Z0-9_]+$/.test(name)) return "const";
  if (/^[A-Z]/.test(name)) return "type-or-class";
  return "function-or-const";
}

function generateStubLine(name) {
  // Check if the symbol is imported with `type` keyword in any importing file
  // For simplicity, use heuristic
  const classification = classifySymbol(name);
  switch (classification) {
    case "type-or-class":
      return `export const ${name}: any = undefined as any;`;
    case "const":
      return `export const ${name}: any = undefined as any;`;
    case "function-or-const":
      return `export function ${name}(...args: any[]): any { return undefined as any; }`;
    default:
      return `export const ${name}: any = undefined as any;`;
  }
}

// Also check the importing file to see if the symbol is imported as a type
function isTypeImport(importingFileRel, moduleSpecifier, symbolName) {
  const importingFileAbs = path.resolve(ROOT, importingFileRel);
  if (!fs.existsSync(importingFileAbs)) return false;
  const content = fs.readFileSync(importingFileAbs, "utf-8");

  // Check if symbol appears in `import type { ... }` or `import { type SymbolName, ... }`
  // Pattern 1: import type { ..., SymbolName, ... } from 'mod'
  const typeImportRe = new RegExp(
    `import\\s+type\\s+\\{[^}]*\\b${symbolName}\\b[^}]*\\}\\s+from\\s+['"][^'"]*['"]`
  );
  if (typeImportRe.test(content)) return true;

  // Pattern 2: import { ..., type SymbolName, ... } from 'mod'
  const inlineTypeRe = new RegExp(
    `import\\s+\\{[^}]*\\btype\\s+${symbolName}\\b[^}]*\\}\\s+from\\s+['"][^'"]*['"]`,
    "s"
  );
  if (inlineTypeRe.test(content)) return true;

  return false;
}

let fixedCount = 0;

for (const [targetPath, symbols] of missingExports) {
  // Find where to add the exports
  let targetFile = targetPath;

  // If the target is a barrel file, find a suitable sub-module
  if (isBarrelFile(targetPath)) {
    const reExportTargets = findReExportTargets(targetPath);
    // Find the first stub sub-module, or the first sub-module
    let foundStub = null;
    for (const t of reExportTargets) {
      if (fs.existsSync(t)) {
        const content = fs.readFileSync(t, "utf-8");
        if (content.startsWith(STUB_MARKER)) {
          foundStub = t;
          break;
        }
      }
    }
    if (foundStub) {
      targetFile = foundStub;
    } else if (reExportTargets.length > 0) {
      // No stub sub-module found; pick the first target (might need to create a stub)
      targetFile = reExportTargets[0];
      if (!fs.existsSync(targetFile)) {
        // Create new stub
        const dir = path.dirname(targetFile);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(targetFile, STUB_MARKER + "\n\n", "utf-8");
      }
    } else {
      // No re-export targets found; skip or add directly (shouldn't happen for a barrel)
      continue;
    }
  }

  if (!fs.existsSync(targetFile)) {
    // Can't fix — skip
    continue;
  }

  let content = fs.readFileSync(targetFile, "utf-8");

  // Only modify stub files
  if (!content.startsWith(STUB_MARKER)) {
    console.log(`  SKIPPED (real file): ${path.relative(ROOT, targetFile)}`);
    continue;
  }

  let modified = false;
  for (const sym of symbols) {
    // Check if already exported
    const exportRe = new RegExp(
      `export\\s+(?:type|const|function|class|let|var|interface|enum)\\s+${sym}\\b`
    );
    if (exportRe.test(content)) continue;

    // Add the export
    content = content.trimEnd() + "\n" + generateStubLine(sym) + "\n";
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(targetFile, content, "utf-8");
    fixedCount++;
    console.log(`  Fixed: ${path.relative(ROOT, targetFile)} (+${symbols.size} exports: ${[...symbols].join(", ")})`);
  }
}

console.log(`\nFixed ${fixedCount} files.`);
