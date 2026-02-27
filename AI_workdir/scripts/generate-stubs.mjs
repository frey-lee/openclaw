/**
 * Auto-generate TypeScript stub files for missing local modules.
 *
 * Usage: node generate-stubs.mjs
 *
 * 1. Runs `npx tsc --noEmit` and captures TS2307 errors.
 * 2. For each missing LOCAL module (relative imports), reads the importing file
 *    to discover what symbols are imported.
 * 3. Creates a stub .ts file that exports those symbols with minimal "any" implementations.
 *
 * If stubs already exist (from a prior run), they are OVERWRITTEN so that all
 * symbols are present.
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd());
const SRC = path.join(ROOT, "src");

// npm packages to skip (not local modules)
const SKIP_PACKAGES = new Set([
  "vitest",
  "chokidar",
  "node-llama-cpp",
  "sqlite-vec",
  "@lydell/node-pty",
  "sharp",
]);

// ── Step 1: Run tsc and collect TS2307 + TS2614 + TS2305 errors ──────────────

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

// ── Collect missing module info from TS2307 ──────────────────────────────────
const ts2307Pattern =
  /^(.+?)\(\d+,\d+\): error TS2307: Cannot find module '([^']+)'/gm;

// Map<absoluteTargetTsPath, Set<importingFileAbs>>
const missingModules = new Map();

let match;
while ((match = ts2307Pattern.exec(tscOutput)) !== null) {
  const importingFileRel = match[1].replace(/\\/g, "/");
  const moduleSpecifier = match[2];

  if (!moduleSpecifier.startsWith(".")) continue;

  const importingFileAbs = path.resolve(ROOT, importingFileRel);
  const importingDir = path.dirname(importingFileAbs);

  let targetPath = path.resolve(importingDir, moduleSpecifier);
  if (targetPath.endsWith(".js")) {
    targetPath = targetPath.slice(0, -3) + ".ts";
  } else if (targetPath.endsWith(".json")) {
    // keep as-is
  } else if (!targetPath.endsWith(".ts")) {
    targetPath = targetPath + ".ts";
  }

  if (!missingModules.has(targetPath)) {
    missingModules.set(targetPath, new Set());
  }
  missingModules.get(targetPath).add(importingFileAbs);
}

// Also collect TS2614 and TS2305 errors: modules that exist but lack exports
// TS2614: Module '"../path.js"' has no exported member 'X'. Did you mean ...
// TS2305: Module '"./path.js"' has no exported member 'X'.
// TS2724: '"./path.js"' has no exported member named 'X'. Did you mean 'Y'?
// The module specifier is always in '"..."' format (single-quote, double-quote, path, double-quote, single-quote)
const tsMissingExportPattern =
  /^(.+?)\(\d+,\d+\): error TS(?:2614|2305|2724): (?:Module\s+)?'"(\.\.?[^"]+)"'\s+has no exported member/gm;

const modulesNeedingExports = new Map(); // targetTsPath → Set<importingFileAbs>

while ((match = tsMissingExportPattern.exec(tscOutput)) !== null) {
  const importingFileRel = match[1].replace(/\\/g, "/");
  const moduleSpecifier = match[2];

  if (!moduleSpecifier.startsWith(".")) continue;

  const importingFileAbs = path.resolve(ROOT, importingFileRel);
  const importingDir = path.dirname(importingFileAbs);

  let targetPath = path.resolve(importingDir, moduleSpecifier);
  if (targetPath.endsWith(".js")) {
    targetPath = targetPath.slice(0, -3) + ".ts";
  } else if (!targetPath.endsWith(".ts") && !targetPath.endsWith(".json")) {
    targetPath = targetPath + ".ts";
  }

  if (!modulesNeedingExports.has(targetPath)) {
    modulesNeedingExports.set(targetPath, new Set());
  }
  modulesNeedingExports.get(targetPath).add(importingFileAbs);
}

// Merge: add modules that need exports to the missingModules map too
for (const [targetPath, importers] of modulesNeedingExports) {
  if (!missingModules.has(targetPath)) {
    missingModules.set(targetPath, new Set());
  }
  for (const imp of importers) {
    missingModules.get(targetPath).add(imp);
  }
}

console.log(`Found ${missingModules.size} modules to create/update stubs for.`);

// ── Step 2: Parse imports ────────────────────────────────────────────────────

/**
 * Extract all complete import/export statement strings from file content
 * that reference a given module specifier.
 *
 * Strategy: find every occurrence of the module specifier in quotes preceded by `from`,
 * then scan backward to find the `import`/`export` keyword that starts the statement.
 */
function extractStatements(fileContent, moduleSpecifier) {
  const statements = [];
  const target1 = `from '${moduleSpecifier}'`;
  const target2 = `from "${moduleSpecifier}"`;

  let searchIdx = 0;
  while (true) {
    let idx = fileContent.indexOf(target1, searchIdx);
    if (idx === -1) idx = fileContent.indexOf(target2, searchIdx);
    if (idx === -1) break;

    // Find the end of this statement (semicolon or newline after the from-clause)
    const endIdx = idx + (fileContent.indexOf(target1, searchIdx) === idx ? target1.length : target2.length);

    // Scan backward from `idx` to find the start keyword (import or export)
    let startIdx = idx;
    // Go backward to find 'import' or 'export'
    const searchBack = fileContent.substring(Math.max(0, idx - 2000), idx);
    // Find the LAST import/export keyword before the from clause
    const backLines = searchBack.split("\n");
    let found = false;
    let accumulatedLen = searchBack.length;

    for (let i = backLines.length - 1; i >= 0; i--) {
      const line = backLines[i];
      accumulatedLen -= line.length + 1; // +1 for \n

      if (/^\s*(import|export)\s/.test(line)) {
        startIdx = Math.max(0, idx - 2000) + accumulatedLen + 1;
        // But handle first line
        if (i === 0) {
          startIdx = Math.max(0, idx - 2000);
        }
        found = true;
        break;
      }
    }

    if (found) {
      const stmt = fileContent.substring(startIdx, endIdx).trim();
      statements.push(stmt);
    }

    searchIdx = endIdx;
  }

  return statements;
}

/**
 * Parse a single import/export statement string into structured data.
 */
function parseStatement(stmt) {
  const result = {
    defaultImport: null,
    namedImports: [],
    namespaceImport: null,
    isTypeOnlyImport: false,
    hasStarExport: false,
  };

  // Remove the `from '...'` part
  const fromIdx = stmt.lastIndexOf(" from ");
  if (fromIdx === -1) return result;
  const beforeFrom = stmt.substring(0, fromIdx).trim();

  // export * from '...'
  if (/^export\s+\*\s*$/.test(beforeFrom)) {
    result.hasStarExport = true;
    return result;
  }

  // Check if entire import is type-only: `import type ...`
  const isTypeOnly = /^import\s+type\b/.test(beforeFrom);

  // export { ... } or export type { ... }
  if (/^export\s+(?:type\s+)?\{/.test(beforeFrom)) {
    const braceContent = extractBraceContent(beforeFrom);
    if (braceContent !== null) {
      result.namedImports = parseNamedList(braceContent, false);
    }
    return result;
  }

  // import * as X
  const nsMatch = beforeFrom.match(/^import\s+(?:type\s+)?\*\s+as\s+(\w+)\s*$/);
  if (nsMatch) {
    result.namespaceImport = nsMatch[1];
    result.isTypeOnlyImport = isTypeOnly;
    return result;
  }

  // import Default, { named } or import Default or import { named }
  // import type { named } or import type Default

  // Strip leading 'import' or 'import type'
  let rest = beforeFrom.replace(/^import\s+(?:type\s+)?/, "").trim();

  // Check for braces
  const braceStart = rest.indexOf("{");
  if (braceStart !== -1) {
    // Everything before the brace could be a default import
    const beforeBrace = rest.substring(0, braceStart).replace(/,\s*$/, "").trim();
    if (beforeBrace && /^\w+$/.test(beforeBrace)) {
      result.defaultImport = beforeBrace;
    }

    const braceContent = extractBraceContent(rest);
    if (braceContent !== null) {
      result.namedImports = parseNamedList(braceContent, isTypeOnly);
    }
  } else {
    // No braces → could be default import: import Default from '...'
    const defaultName = rest.trim();
    if (/^\w+$/.test(defaultName)) {
      result.defaultImport = defaultName;
    }
  }

  return result;
}

/**
 * Extract text between first { and last } in a string.
 */
function extractBraceContent(str) {
  const start = str.indexOf("{");
  const end = str.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return str.substring(start + 1, end);
}

/**
 * Parse a comma-separated named import list like "type ExecAsk, addAllowlistEntry, Foo as Bar"
 */
function parseNamedList(listStr, isEntireStatementTypeOnly) {
  const items = listStr.split(",").map((s) => s.trim()).filter(Boolean);
  const result = [];

  for (const item of items) {
    // Handle "type Foo as Bar", "Foo as Bar", "type Foo", "Foo"
    const parts = item.split(/\s+as\s+/);
    let nameStr = parts[0].trim();
    const alias = parts[1]?.trim();

    const isInlineType = nameStr.startsWith("type ");
    if (isInlineType) {
      nameStr = nameStr.replace(/^type\s+/, "").trim();
    }

    const isType = isEntireStatementTypeOnly || isInlineType;

    result.push({ name: nameStr, isType, alias });
  }

  return result;
}

/**
 * Parse all import/export statements from a file that reference a given module.
 */
function parseImportsRobust(fileContent, moduleSpecifier) {
  const combined = {
    defaultImport: null,
    namedImports: [],
    namespaceImport: null,
    isTypeOnlyImport: false,
    hasStarExport: false,
  };

  const stmts = extractStatements(fileContent, moduleSpecifier);
  for (const stmt of stmts) {
    const parsed = parseStatement(stmt);
    if (parsed.defaultImport) combined.defaultImport = parsed.defaultImport;
    if (parsed.namespaceImport) combined.namespaceImport = parsed.namespaceImport;
    if (parsed.isTypeOnlyImport) combined.isTypeOnlyImport = true;
    if (parsed.hasStarExport) combined.hasStarExport = true;
    combined.namedImports.push(...parsed.namedImports);
  }

  return combined;
}

// ── Step 3: Classify and generate stubs ──────────────────────────────────────

function classifySymbol(name) {
  if (/^[A-Z][A-Z0-9_]+$/.test(name)) return "const";
  if (/^[A-Z]/.test(name)) return "type-or-class";
  return "function-or-const";
}

function generateStub(name, isType) {
  if (isType) {
    return `export type ${name} = any;`;
  }
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

// ── Step 4: Process each missing module ──────────────────────────────────────

let createdCount = 0;
let updatedCount = 0;
let skippedCount = 0;
const createdFiles = [];
const updatedFiles = [];

// Track which files are stubs we generated (to allow overwriting)
const STUB_MARKER = "// Auto-generated stub file";

for (const [targetPath, importingFiles] of missingModules) {
  // Handle JSON files
  if (targetPath.endsWith(".json")) {
    if (!fs.existsSync(targetPath)) {
      const dir = path.dirname(targetPath);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(targetPath, "{}\n", "utf-8");
      createdCount++;
      createdFiles.push(targetPath);
      console.log(`  Created JSON stub: ${path.relative(ROOT, targetPath)}`);
    }
    continue;
  }

  // Check if file exists and is NOT a stub (i.e., real code — don't overwrite)
  if (fs.existsSync(targetPath)) {
    const existing = fs.readFileSync(targetPath, "utf-8");
    if (!existing.startsWith(STUB_MARKER)) {
      // It's a real file, not a stub — still need to check if exports are missing
      // For now skip real files; we only overwrite stubs
      skippedCount++;
      continue;
    }
  }

  // Collect all symbols imported from this module across all importing files
  const allNamedImports = new Map(); // name → { isType: boolean }
  let hasDefaultImport = false;
  let hasNamespaceImport = false;
  let hasStarExport = false;

  for (const importingFile of importingFiles) {
    if (!fs.existsSync(importingFile)) continue;
    const content = fs.readFileSync(importingFile, "utf-8");

    // Determine the module specifier as it appears in the importing file
    const importingDir = path.dirname(importingFile);
    let relPath = path.relative(importingDir, targetPath).replace(/\\/g, "/");
    if (relPath.endsWith(".ts")) {
      relPath = relPath.slice(0, -3) + ".js";
    }
    if (!relPath.startsWith(".")) {
      relPath = "./" + relPath;
    }

    const parsed = parseImportsRobust(content, relPath);

    if (parsed.defaultImport) hasDefaultImport = true;
    if (parsed.namespaceImport) hasNamespaceImport = true;
    if (parsed.hasStarExport) hasStarExport = true;

    for (const imp of parsed.namedImports) {
      const existing = allNamedImports.get(imp.name);
      if (existing) {
        if (!imp.isType) existing.isType = false;
      } else {
        allNamedImports.set(imp.name, { isType: imp.isType });
      }
    }
  }

  // Generate stub content
  const stubLines = [STUB_MARKER, ""];

  for (const [name, meta] of allNamedImports) {
    stubLines.push(generateStub(name, meta.isType));
  }

  if (hasDefaultImport) {
    stubLines.push("");
    stubLines.push("export default {} as any;");
  }

  if (hasStarExport && allNamedImports.size === 0 && !hasDefaultImport) {
    stubLines.push("export {};");
  }

  if (allNamedImports.size === 0 && !hasDefaultImport && !hasStarExport) {
    stubLines.push("export {};");
  }

  stubLines.push("");

  const dir = path.dirname(targetPath);
  fs.mkdirSync(dir, { recursive: true });

  const isUpdate = fs.existsSync(targetPath);
  fs.writeFileSync(targetPath, stubLines.join("\n"), "utf-8");

  if (isUpdate) {
    updatedCount++;
    updatedFiles.push(targetPath);
    console.log(`  Updated stub: ${path.relative(ROOT, targetPath)} (${allNamedImports.size} exports)`);
  } else {
    createdCount++;
    createdFiles.push(targetPath);
    console.log(`  Created stub: ${path.relative(ROOT, targetPath)} (${allNamedImports.size} exports)`);
  }
}

console.log(`\n=== Summary ===`);
console.log(`Created: ${createdCount} new stub files`);
console.log(`Updated: ${updatedCount} existing stub files`);
console.log(`Skipped: ${skippedCount} real (non-stub) files`);
