#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting verification pipeline...');
console.log('📅 Timestamp:', new Date().toISOString());

const steps = [
    { name: 'Version Check', script: 'version-check.mjs' },
    { name: 'Syncpack Check', script: 'syncpack.mjs' },
    { name: 'Package Names', script: 'pkg-names.mjs' },
    { name: 'UI Validation', script: 'ui-validation.mjs' },
    { name: 'Contract Validation', script: 'contracts.mjs' },
    { name: 'Client Generation', script: 'client-gen.mjs' },
    { name: 'ESLint', script: 'lint.mjs' },
    { name: 'TypeScript', script: 'types.mjs' },
    { name: 'Dependency Cruiser', script: 'depcruise.mjs' }
];

const results = [];
let currentStep = 0;

function runStep(stepIndex) {
    if (stepIndex >= steps.length) {
        // All steps completed
        generateFinalReport();
        process.exit(0);
    }

    const step = steps[stepIndex];
    console.log(`\n📋 Step ${stepIndex + 1}/${steps.length}: ${step.name}`);

    const startTime = Date.now();

    const scriptPath = join(__dirname, step.script);
    const p = spawn('node', [scriptPath], { stdio: 'inherit' });

    p.on('close', (code) => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        results.push({
            step: step.name,
            script: step.script,
            status: code === 0 ? 'passed' : 'failed',
            duration: duration,
            timestamp: new Date().toISOString()
        });

        if (code === 0) {
            console.log(`✅ ${step.name} completed in ${duration}ms`);
            runStep(stepIndex + 1);
        } else {
            console.log(`❌ ${step.name} failed with exit code ${code}`);
            generateFinalReport();
            process.exit(code);
        }
    });
}

function generateFinalReport() {
    try {
        mkdirSync('reports', { recursive: true });

        const summary = {
            timestamp: new Date().toISOString(),
            totalSteps: steps.length,
            passed: results.filter(r => r.status === 'passed').length,
            failed: results.filter(r => r.status === 'failed').length,
            totalDuration: results.reduce((sum, r) => sum + r.duration, 0),
            results: results
        };

        writeFileSync('reports/verification-summary.json', JSON.stringify(summary, null, 2));

        console.log('\n📊 Verification Summary:');
        console.log(`✅ Passed: ${summary.passed}/${summary.totalSteps}`);
        console.log(`❌ Failed: ${summary.failed}/${summary.totalSteps}`);
        console.log(`⏱️  Total Duration: ${summary.totalDuration}ms`);
        console.log('📄 Detailed report saved to reports/verification-summary.json');

        if (summary.failed > 0) {
            console.log('\n❌ Verification failed. Check individual reports for details.');
        } else {
            console.log('\n🎉 All verification steps passed!');
        }
    } catch (error) {
        console.error('❌ Failed to generate final report:', error.message);
    }
}

// Start the verification pipeline
runStep(0);
