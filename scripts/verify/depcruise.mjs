#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';

const cmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

console.log('🔍 Running dependency cruiser...');

// Run dependency cruiser with JSON output
const args = ['-w', 'exec', 'depcruise', '--validate', '.dependency-cruiser.cjs', 'apps', 'packages', '--output-type', 'json'];

const p = spawn(cmd, args, {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true  // Enable shell mode for Windows compatibility
});

let stdout = '';
let stderr = '';

p.stdout.on('data', (data) => {
    stdout += data.toString();
});

p.stderr.on('data', (data) => {
    stderr += data.toString();
});

p.on('close', (code) => {
    try {
        mkdirSync('reports', { recursive: true });

        // Parse dependency cruiser output
        let depcruiseResults = {};
        if (stdout.trim()) {
            try {
                depcruiseResults = JSON.parse(stdout);
            } catch (parseError) {
                console.log('📝 Dependency cruiser output (non-JSON):', stdout);
                depcruiseResults = { summary: { violations: [] } };
            }
        }

        const depcruiseReport = {
            timestamp: new Date().toISOString(),
            status: code === 0 ? 'passed' : 'failed',
            results: depcruiseResults,
            summary: {
                violations: depcruiseResults.summary?.violations || 0,
                errors: depcruiseResults.summary?.errors || 0,
                warnings: depcruiseResults.summary?.warnings || 0,
                orphans: depcruiseResults.summary?.orphans || 0
            }
        };

        writeFileSync('reports/depcruise.json', JSON.stringify(depcruiseReport, null, 2));

        if (code === 0) {
            console.log('✅ Dependency cruiser passed');
        } else {
            console.log('❌ Dependency cruiser failed');
            console.log('📄 Report saved to reports/depcruise.json');
        }

        process.exit(code);
    } catch (error) {
        console.error('❌ Failed to process dependency cruiser results:', error.message);
        process.exit(1);
    }
});
