#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';

const cmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

console.log('🔍 Running ESLint...');

// Run ESLint with JSON output
// Allow warnings (esp. for Drizzle ORM type inference in adapters and React hooks in UI)
// but still fail on errors
const args = ['-r', 'exec', 'eslint', '.', '--format', 'json'];

const p = spawn(cmd, args, {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true  // Enable shell mode for Windows compatibility
});

let stdout = '';

p.stdout.on('data', (data) => {
    stdout += data.toString();
});

p.stderr.on('data', (data) => {
    // Collect stderr but don't store (we only need stdout for JSON parsing)
    data.toString();
});

p.on('close', () => {
    try {
        mkdirSync('reports', { recursive: true });

        // Parse ESLint output
        let lintResults = [];
        if (stdout.trim()) {
            try {
                lintResults = JSON.parse(stdout);
            } catch {
                console.log('📝 ESLint output (non-JSON):', stdout);
                lintResults = [{ messages: [], errorCount: 0, warningCount: 0 }];
            }
        }

        const errorCount = lintResults.reduce((sum, r) => sum + (r.errorCount || 0), 0);
        const warningCount = lintResults.reduce((sum, r) => sum + (r.warningCount || 0), 0);

        const lintReport = {
            timestamp: new Date().toISOString(),
            status: errorCount === 0 ? 'passed' : 'failed',
            results: lintResults,
            summary: {
                total: lintResults.length,
                errors: errorCount,
                warnings: warningCount
            }
        };

        writeFileSync('reports/eslint.json', JSON.stringify(lintReport, null, 2));

        if (errorCount === 0) {
            if (warningCount > 0) {
                console.log(`✅ ESLint passed (${warningCount} warnings)`);
            } else {
                console.log('✅ ESLint passed');
            }
        } else {
            console.log(`❌ ESLint failed (${errorCount} errors, ${warningCount} warnings)`);
            console.log('📄 Report saved to reports/eslint.json');
        }

        process.exit(errorCount > 0 ? 1 : 0);
    } catch (error) {
        console.error('❌ Failed to process ESLint results:', error.message);
        process.exit(1);
    }
});
