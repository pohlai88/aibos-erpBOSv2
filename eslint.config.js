import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import boundariesPlugin from 'eslint-plugin-boundaries';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

export default [
  // --- GLOBAL IGNORE (must be first, no "files" key) ---
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/.next/types/**',
      '**/.next/static/**',
      '**/dist/**',
      '**/build/**',
      '**/.turbo/**',
      '**/.cache/**',
      '**/coverage/**',
      '**/out/**'
    ],
  },

  // --- Base JS recommended on everything ---
  ...compat.extends('eslint:recommended'),

  // --- Define module element types for boundaries ---
  {
    settings: {
      // Map your repo layout to logical "element types"
      'boundaries/elements': [
        { type: 'web', pattern: 'apps/web' },
        { type: 'bff', pattern: 'apps/bff' },
        { type: 'worker', pattern: 'apps/worker' },
        { type: 'pkg', pattern: 'packages/*' },
        { type: 'services', pattern: 'packages/services' },
        { type: 'contracts', pattern: 'packages/contracts' },
        { type: 'client', pattern: 'packages/api-client' },
        { type: 'adapter', pattern: 'packages/adapters/*' },
        { type: 'ports', pattern: 'packages/ports' },
        { type: 'policies', pattern: 'packages/policies' },
        { type: 'posting-rules', pattern: 'packages/posting-rules' },
        { type: 'utils', pattern: 'packages/utils' },
        { type: 'sdk', pattern: 'packages/sdk' },
        { type: 'testing', pattern: 'packages/testing' },
      ],
    },
    plugins: {
      '@typescript-eslint': tseslint,
      boundaries: boundariesPlugin,
    },
  },

  // --- TypeScript (non type-checked) pass for speed ---
  {
    files: ['**/*.ts', '**/*.tsx'],
    // keep TS parser OFF of d.ts and build artifacts entirely
    ignores: [
      '**/*.d.ts',
      '**/next-env.d.ts',
      '**/.next/**',
      '**/dist/**',
      '**/build/**',
      '**/.turbo/**',
      '**/.cache/**',
      '**/coverage/**',
      '**/out/**'
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: [
          './packages/*/tsconfig.json',
          './apps/*/tsconfig.json',
        ],
        tsconfigRootDir: __dirname,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      boundaries: boundariesPlugin,
    },
    rules: {
      /**
       * Enforce & AUTO-FIX type-only imports/exports.
       * Works hand-in-hand with "verbatimModuleSyntax": true.
       */
      '@typescript-eslint/consistent-type-imports': ['error', {
        prefer: 'type-imports',
        disallowTypeAnnotations: false,
        fixStyle: 'separate-type-imports'
      }],
      '@typescript-eslint/consistent-type-exports': ['error', {
        fixMixedExportsWithInlineTypeSpecifier: true
      }],

      // Module boundaries: reference element types, not paths
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            // web can import from contracts & api client
            { from: ['web'], allow: ['contracts', 'client'] },

            // bff can import from services, contracts, adapter, ports, policies, posting-rules
            {
              from: ['bff'],
              allow: [
                'services',
                'contracts',
                'adapter',
                'ports',
                'policies',
                'posting-rules',
              ],
            },

            // worker can import from adapter, ports
            { from: ['worker'], allow: ['adapter', 'ports'] },

            // services can import contracts, ports, policies, posting-rules
            {
              from: ['services'],
              allow: ['contracts', 'ports', 'policies', 'posting-rules'],
            },

            // contracts can only import other contracts (pure layer)
            { from: ['contracts'], allow: ['contracts'] },

            // adapters (db, etc.) can import contracts, ports
            { from: ['adapter'], allow: ['contracts', 'ports'] },

            // ports can import contracts
            { from: ['ports'], allow: ['contracts'] },

            // policies can import contracts
            { from: ['policies'], allow: ['contracts'] },

            // posting-rules can import contracts
            { from: ['posting-rules'], allow: ['contracts'] },

            // utils can import contracts
            { from: ['utils'], allow: ['contracts'] },

            // sdk can import contracts
            { from: ['sdk'], allow: ['contracts'] },

            // testing can import contracts, adapter, ports
            { from: ['testing'], allow: ['contracts', 'adapter', 'ports'] },
          ],
        },
      ],

      // TypeScript strict mode - enforce type safety
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/restrict-template-expressions': ['error', {
        allowNumber: true,
        allowBoolean: true,
        allowNullish: true,
      }],

      // Let TS handle unused vars
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      '@typescript-eslint/triple-slash-reference': 'warn',
    },
  },

  // --- API Routes - Enforce consistent patterns ---
  {
    files: ['apps/bff/app/api/**/*.{ts,tsx}'],
    ignores: ['apps/bff/app/api/_kit/**', 'apps/bff/app/api/_lib/**'],
    rules: {
      // 🚫 Prevent API routes from importing BFF internals (main architectural violation)
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../lib/*', '../../lib/*', '../../../lib/*'],
              message: '🚫 API routes cannot import BFF lib files. Use Contracts layer instead.'
            },
            {
              group: ['../services/*', '../../services/*', '../../../services/*'],
              message: '🚫 API routes cannot import BFF services. Use Services layer instead.'
            }
          ]
        }
      ],

      // Enforce withRouteErrors wrapper
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "ExportNamedDeclaration[declaration.type='FunctionDeclaration'] > FunctionDeclaration[id.name=/^(GET|POST|PUT|PATCH|DELETE|OPTIONS)$/]",
          message:
            "Use 'export const METHOD = withRouteErrors(async ...)' instead of 'export async function METHOD'",
        },
        {
          // Catch exported const handlers like: export const GET = async () => ...
          selector:
            "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[id.name=/^(GET|POST|PUT|PATCH|DELETE|OPTIONS)$/]",
          message:
            "Wrap exported route handlers: 'export const METHOD = withRouteErrors(async ...)'",
        },
        {
          selector:
            "CallExpression[callee.object.name='Response'][callee.property.name='json']",
          message:
            'Use ok()/badRequest() from @/api/_kit instead of Response.json',
        },
        {
          selector:
            "CallExpression[callee.object.name='NextResponse'][callee.property.name='json']",
          message:
            'Use ok()/badRequest() from @/api/_kit instead of NextResponse.json',
        },
      ],
    },
  },

  // --- Tests & scripts loosened ---
  {
    files: ['**/*.test.*', '**/*.spec.*', 'scripts/**/*.{js,ts,mjs,cjs,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },

  // --- Adapters package - Relax strict type checking for Drizzle ORM ---
  {
    files: ['packages/adapters/**/*.ts'],
    ignores: ['packages/adapters/**/*.test.*', 'packages/adapters/**/*.spec.*'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
    },
  },

  // --- UI/Client components - Relax strict type checking for presentation layer ---
  {
    files: ['apps/web/**/*.tsx', 'apps/web/**/*.ts'],
    ignores: ['apps/web/**/*.test.*', 'apps/web/**/*.spec.*'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
    },
  },

  // --- Contracts package - allow redeclarations ---
  {
    files: ['packages/contracts/**/*.ts'],
    rules: {
      'no-redeclare': 'off',
    },
  },

  // --- TypeScript declaration files - disable type-aware rules ---
  {
    files: ['**/*.d.ts', '**/next-env.d.ts'],
    rules: {
      '@typescript-eslint/triple-slash-reference': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // --- Global language options & linter options ---
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        fetch: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        Headers: 'readonly',
        FormData: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        AbortController: 'readonly',
        console: 'readonly',
        process: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        crypto: 'readonly',
        Buffer: 'readonly',
        File: 'readonly',
        ResponseInit: 'readonly',
        global: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        NodeJS: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        __dirname: 'readonly',
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        React: 'readonly',
        HTMLInputElement: 'readonly',
        performance: 'readonly',
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    ignores: [
      '**/dist/**',
      '**/.next/**',
      '**/types.gen.ts',
      '**/node_modules/**',
      '**/.turbo/**',
      '**/build/**',
      '**/out/**',
      '**/.next/static/**',
      '**/.next/types/**',
    ],
  },
];
