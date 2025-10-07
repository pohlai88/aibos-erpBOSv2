#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';

console.log('🔄 Checking dependency version consistency...');

const cmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

// Run syncpack list-mismatches
const args = ['-w', 'exec', 'syncpack', 'list-mismatches'];

const p = spawn(cmd, args, {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true
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

        // Parse syncpack output to determine if there are mismatches
        const hasMismatches = stdout.includes('✘') || stderr.includes('✘');
        const isValid = !hasMismatches && code === 0;

        const syncpackReport = {
            timestamp: new Date().toISOString(),
            status: isValid ? 'passed' : 'failed',
            output: stdout + stderr,
            summary: {
                hasMismatches: hasMismatches,
                exitCode: code
            }
        };

        writeFileSync('reports/syncpack.json', JSON.stringify(syncpackReport, null, 2));

        if (isValid) {
            console.log('✅ Dependency versions are consistent');
        } else {
            console.log('❌ Dependency version mismatches found');
            console.log('📄 Report saved to reports/syncpack.json');
        }

        process.exit(code);
    } catch (error) {
        console.error('❌ Failed to process syncpack results:', error.message);
        process.exit(1);
    }
});
