#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readdir, stat } from "node:fs/promises";

const repo = process.cwd();
const ROOT = path.join(repo, "tsconfig.base.json");
const BASE = JSON.parse(fs.readFileSync(ROOT, "utf8"));

const MUST_MATCH = [
    ["compilerOptions.moduleResolution", "bundler"],
    ["compilerOptions.module", "ESNext"],
    ["compilerOptions.strict", true],
    ["compilerOptions.verbatimModuleSyntax", true],
    ["compilerOptions.skipLibCheck", true],
    ["compilerOptions.noUncheckedIndexedAccess", true],
    ["compilerOptions.exactOptionalPropertyTypes", true]
];

const ALLOWED_OVERRIDES = new Map([
    // apps may override jsx ("preserve" or "react-jsx")
    ["apps/", new Set(["compilerOptions.jsx"])],
    // build configs may override build-specific settings
    ["tsconfig.build.json", new Set([
        "compilerOptions.composite",
        "compilerOptions.rootDir",
        "compilerOptions.outDir",
        "compilerOptions.declaration",
        "compilerOptions.declarationMap",
        "compilerOptions.sourceMap",
        "compilerOptions.tsBuildInfoFile"
    ])]
]);

async function findTsConfigFiles(dir, files = []) {
    try {
        const entries = await readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                await findTsConfigFiles(fullPath, files);
            } else if (entry.isFile() && (entry.name === 'tsconfig.json' || entry.name === 'tsconfig.build.json')) {
                files.push(fullPath);
            }
        }
    } catch (err) {
        // Ignore permission errors
    }

    return files;
}

const files = await findTsConfigFiles(repo);
let errors = [];

function get(obj, dotPath) {
    return dotPath.split(".").reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
}

function inAllowedOverride(file, key) {
    for (const [pattern, allowed] of ALLOWED_OVERRIDES.entries()) {
        if (file.includes(pattern) && allowed.has(key)) {
            return true;
        }
    }
    return false;
}

for (const file of files) {
    try {
        const json = JSON.parse(fs.readFileSync(file, "utf8"));
        for (const [key, expected] of MUST_MATCH) {
            const v = get(json, key);
            if (v === undefined) continue; // inheriting base is OK
            if (v !== expected && !inAllowedOverride(file, key)) {
                errors.push(`${file}: ${key}=${JSON.stringify(v)} (expected ${JSON.stringify(expected)})`);
            }
        }
    } catch (err) {
        errors.push(`${file}: Failed to parse JSON - ${err.message}`);
    }
}

if (errors.length) {
    console.error("[tsconfig-drift] Detected drift:\n" + errors.map(e => " - " + e).join("\n"));
    process.exit(1);
} else {
    console.log("[tsconfig-drift] ✅ No drift detected - all configs comply with SSOT");
}
