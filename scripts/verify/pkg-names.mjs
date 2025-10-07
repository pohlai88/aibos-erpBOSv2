#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';

console.log('🔍 Validating package names...');

const roots = ['.', 'apps', 'packages'];
const pkgs = [];

function walk(dir) {
    try {
        // First check if there's a package.json in the current directory
        const pj = join(dir, 'package.json');
        try {
            const raw = readFileSync(pj, 'utf8');
            pkgs.push({ path: pj, json: JSON.parse(raw) });
        } catch {
            // no package.json here
        }

        // Then walk subdirectories
        for (const e of readdirSync(dir)) {
            const p = join(dir, e);
            const s = statSync(p);
            if (s.isDirectory()) {
                if (e === 'node_modules' || e.startsWith('.')) continue;
                walk(p);
            }
        }
    } catch (error) {
        // Directory doesn't exist or can't be read, skip
    }
}

roots.forEach(walk);

const nameRe = /^[a-z0-9][a-z0-9-]*(@[a-z0-9][a-z0-9-]*\/[a-z0-9][a-z0-9-]*)?$/; // simple guard
let bad = 0;
const results = [];

for (const { path, json } of pkgs) {
    const name = json.name ?? '';
    const isScoped = name.startsWith('@');
    const ok = isScoped
        ? /^@[a-z0-9][a-z0-9-]*\/[a-z0-9][a-z0-9-]*$/.test(name)
        : /^[a-z0-9][a-z0-9-]*$/.test(name);

    const result = {
        path,
        name,
        valid: ok,
        isScoped,
        private: json.private || false
    };

    results.push(result);

    if (!ok) {
        console.error(`❌ Invalid package name: ${name}  (${path})`);
        bad++;
    } else {
        console.log(`✅ Valid package name: ${name}  (${path})`);
    }
}

// Generate JSON report
const report = {
    timestamp: new Date().toISOString(),
    status: bad === 0 ? 'passed' : 'failed',
    summary: {
        total: pkgs.length,
        valid: pkgs.length - bad,
        invalid: bad,
        private: results.filter(r => r.private).length,
        scoped: results.filter(r => r.isScoped).length
    },
    results: results
};

try {
    mkdirSync('reports', { recursive: true });
    writeFileSync('reports/pkg-names.json', JSON.stringify(report, null, 2));
    console.log('📄 Report saved to reports/pkg-names.json');
} catch (error) {
    console.error('❌ Failed to write package names report:', error.message);
}

if (bad) {
    console.log(`\n❌ Package name validation failed: ${bad} invalid names found`);
    process.exit(1);
}

console.log(`\n✅ Package name check passed for ${pkgs.length} packages.`);
console.log(`📊 Summary: ${report.summary.valid} valid, ${report.summary.private} private, ${report.summary.scoped} scoped`);
process.exit(0);
