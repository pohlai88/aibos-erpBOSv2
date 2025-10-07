#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';

const cmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

console.log('🔍 Running ESLint...');

// Run ESLint with JSON output
const args = ['-r', 'exec', 'eslint', '.', '--max-warnings', '0', '--format', 'json'];

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

        // Parse ESLint output
        let lintResults = [];
        if (stdout.trim()) {
            try {
                lintResults = JSON.parse(stdout);
            } catch (parseError) {
                console.log('📝 ESLint output (non-JSON):', stdout);
                lintResults = [{ messages: [], errorCount: 0, warningCount: 0 }];
            }
        }

        const lintReport = {
            timestamp: new Date().toISOString(),
            status: code === 0 ? 'passed' : 'failed',
            results: lintResults,
            summary: {
                total: lintResults.length,
                errors: lintResults.reduce((sum, r) => sum + (r.errorCount || 0), 0),
                warnings: lintResults.reduce((sum, r) => sum + (r.warningCount || 0), 0)
            }
        };

        writeFileSync('reports/eslint.json', JSON.stringify(lintReport, null, 2));

        if (code === 0) {
            console.log('✅ ESLint passed');
        } else {
            console.log('❌ ESLint failed');
            console.log('📄 Report saved to reports/eslint.json');
        }

        process.exit(code);
    } catch (error) {
        console.error('❌ Failed to process ESLint results:', error.message);
        process.exit(1);
    }
});
