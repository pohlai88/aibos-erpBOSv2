import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'happy-dom',
        include: ['**/*.{test,spec}.{ts,tsx}'],
        coverage: {
            provider: 'v8',
            reports: ['text', 'html'],
            exclude: [
                'node_modules/',
                'dist/',
                '**/*.d.ts',
                '**/*.config.*',
                '**/coverage/**'
            ]
        }
    }
});
