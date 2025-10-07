#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';

const cmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

console.log('🔍 Running TypeScript type checking...');

// Run TypeScript compiler
const args = ['-r', 'exec', 'tsc', '--noEmit', '--pretty'];

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

        const typeReport = {
            timestamp: new Date().toISOString(),
            status: code === 0 ? 'passed' : 'failed',
            output: stdout + stderr,
            summary: {
                errors: code === 0 ? 0 : 1, // Simplified - in real implementation, parse tsc output
                warnings: 0
            }
        };

        writeFileSync('reports/tsc.json', JSON.stringify(typeReport, null, 2));

        if (code === 0) {
            console.log('✅ TypeScript type checking passed');
        } else {
            console.log('❌ TypeScript type checking failed');
            console.log('📄 Report saved to reports/tsc.json');
        }

        process.exit(code);
    } catch (error) {
        console.error('❌ Failed to process TypeScript results:', error.message);
        process.exit(1);
    }
});
