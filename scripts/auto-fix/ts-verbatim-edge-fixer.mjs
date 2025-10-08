#!/usr/bin/env node
/**
 * ts-verbatim-edge-fixer.mjs
 * Safe, dependency-free sweeper for edge cases with "verbatimModuleSyntax": true.
 *
 * Strategy (SAFE):
 * - For each file, detect modules that are imported with `import type { ... } from 'x'`.
 * - For matching `export { ... } from 'x'` re-exports in the SAME file:
 *     - Convert only those specifiers that also appear in the type-import set
 *       into `export type { ... } from 'x'`.
 *     - Preserve existing `type` specifiers.
 *     - Handle aliasing: `export { Foo as Bar }`.
 * - Skip: `export * from 'x'`, non-matching modules, already-typed exports.
 *
 * CLI:
 *   --dry           : report changes but don't write
 *   --check         : exit 1 if changes would be made (no writes)
 *   --backup        : write a .bak beside modified files
 *   --include=...   : comma-separated roots (default: apps,packages)
 *   --exclude=...   : comma-separated globs (simple substring match)
 *
 * Run AFTER: eslint --fix
 */

import fs from 'node:fs';
import path from 'node:path';

const args = new Set(process.argv.slice(2));
const getArg = (key, fallback = null) => {
    const a = [...process.argv.slice(2)].find(s => s.startsWith(`${key}=`));
    return a ? a.split('=').slice(1).join('=') : fallback;
};

const DRY = args.has('--dry');
const CHECK = args.has('--check');
const BACKUP = args.has('--backup');

const includeCsv = getArg('--include', 'apps,packages');
const excludeCsv = getArg('--exclude', 'node_modules,dist,.next,build,.turbo,.cache,coverage');

const TARGET_DIRS = includeCsv.split(',').map(s => s.trim()).filter(Boolean);
const EXCLUDES = excludeCsv.split(',').map(s => s.trim()).filter(Boolean);

const ROOT = process.cwd();

function isExcluded(p) {
    const rel = path.relative(ROOT, p).replace(/\\/g, '/');
    return EXCLUDES.some(x => rel.includes(x));
}

/** Recursively collect .ts/.tsx (not .d.ts) files under dirs */
function walk(dir) {
    let out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.')) continue;
        const p = path.join(dir, entry.name);
        if (isExcluded(p)) continue;
        if (entry.isDirectory()) {
            out = out.concat(walk(p));
        } else if (/\.(ts|tsx)$/.test(entry.name) && !/\.d\.ts$/.test(entry.name)) {
            out.push(p);
        }
    }
    return out;
}

const files = TARGET_DIRS
    .filter(d => fs.existsSync(path.join(ROOT, d)))
    .flatMap(d => walk(path.join(ROOT, d)));

const importTypeRe = /import\s+type\s*{\s*([^}]*)\s*}\s*from\s*(['"])([^'"]+)\2\s*;/g;
// Multiline-friendly re-export list (NOT star exports)
const exportListRe = /export\s*{\s*([\s\S]*?)\s*}\s*from\s*(['"])([^'"]+)\2\s*;/g;

let changedCount = 0;
let touchedFiles = 0;

for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');

    // Build map: module -> Set(typeImportedNames)
    const typeImports = new Map();
    for (const m of src.matchAll(importTypeRe)) {
        const namesRaw = m[1]; // e.g. "Foo, Bar as Baz"
        const mod = m[3];
        const set = typeImports.get(mod) ?? new Set();
        namesRaw.split(',').forEach(part => {
            const n = part.trim();
            if (!n) return;
            // support alias "X as Y" -> store both X and Y as seen names
            const mAlias = n.match(/^([^ \t]+)\s+as\s+([^ \t]+)$/i);
            if (mAlias) {
                set.add(mAlias[1].trim());
                set.add(mAlias[2].trim());
            } else {
                set.add(n);
            }
        });
        typeImports.set(mod, set);
    }

    if (typeImports.size === 0) continue; // nothing to do safely

    let mutated = false;
    let next = src.replace(exportListRe, (full, specifiersRaw, quote, mod) => {
        // Skip star-like exports caught accidentally (guarded by regex, but be safe)
        if (specifiersRaw.includes('*')) return full;

        // Collect specifiers, preserve whitespace and aliases
        // e.g. "Foo, type Bar, Baz as Qux"
        const parts = specifiersRaw.split(',').map(s => s.trim()).filter(Boolean);

        // If there is no type import for this module, leave export unchanged
        const typeSet = typeImports.get(mod);
        if (!typeSet || typeSet.size === 0) return full;

        // Partition specifiers into:
        //   - already typed (prefixed with "type ")
        //   - should become typed (present in typeSet: name or alias)
        //   - leave as is (value exports)
        const typed = [];
        const values = [];

        for (const p of parts) {
            if (/^type\s+/.test(p)) {
                typed.push(p); // already typed
                continue;
            }
            // Support aliasing: "Foo as Bar"
            const mAlias = p.match(/^([^ \t]+)\s+as\s+([^ \t]+)$/i);
            if (mAlias) {
                const [_, left, right] = mAlias;
                if (typeSet.has(left) || typeSet.has(right)) {
                    typed.push(`type ${left} as ${right}`);
                } else {
                    values.push(p);
                }
                continue;
            }
            // Simple name
            if (typeSet.has(p)) {
                typed.push(`type ${p}`);
            } else {
                values.push(p);
            }
        }

        // If nothing moved, keep original
        if (typed.length === 0) return full;

        // Reconstruct as:
        //   export type { typed... } from 'mod';
        //   export { values... } from 'mod';   (only if any values remain)
        mutated = true;

        const lines = [];
        lines.push(`export type { ${typed.join(', ')} } from ${quote}${mod}${quote};`);
        if (values.length > 0) {
            lines.push(`export { ${values.join(', ')} } from ${quote}${mod}${quote};`);
        }
        return lines.join('\n');
    });

    if (mutated && next !== src) {
        touchedFiles++;
        const write = !DRY && !CHECK;
        if (write && BACKUP) {
            fs.writeFileSync(`${file}.bak`, src, 'utf8');
        }
        if (write) {
            fs.writeFileSync(file, next, 'utf8');
        }
        changedCount++;
    }
}

if (CHECK && changedCount > 0) {
    console.error(`[ts-verbatim-edge-fixer] ❌ Would update ${changedCount} block(s) across ${touchedFiles} file(s).`);
    process.exit(1);
}

console.log(`[ts-verbatim-edge-fixer] ${DRY || CHECK ? 'Would update' : 'Updated'} ${changedCount} block(s) across ${touchedFiles} file(s).`);