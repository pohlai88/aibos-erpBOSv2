# Master Package Configuration Guardrails

## Overview

This document serves as the **Single Source of Truth (SSOT)** for all package configurations in the AI-BOS ERP monorepo. It defines battle-tested patterns, prevents drift, ensures consistency, and provides comprehensive guardrails for maintaining a production-ready monorepo architecture.

## Table of Contents

1. [Core Principles](#core-principles)
2. [Package Manager Configuration](#package-manager-configuration)
3. [Workspace Structure](#workspace-structure)
4. [Package Naming Conventions](#package-naming-conventions)
5. [Version Management](#version-management)
6. [Dependency Management](#dependency-management)
7. [Build Configuration](#build-configuration)
8. [TypeScript Configuration](#typescript-configuration)
9. [Scripts Standardization](#scripts-standardization)
10. [Quality Assurance](#quality-assurance)
11. [Enforcement Rules](#enforcement-rules)
12. [Migration Guidelines](#migration-guidelines)

## Core Principles

### 1. Zero Drift Policy

- **All packages MUST follow identical patterns** for similar functionality
- **Version synchronization** across all packages using syncpack
- **Consistent naming conventions** across the entire monorepo
- **Standardized build processes** for all packages

### 2. Production-Ready Standards

- **Exact version pinning** for core dependencies
- **Comprehensive type safety** with strict TypeScript configuration
- **Automated quality checks** via pre-commit hooks
- **Dependency isolation** using pnpm's isolated node linker

### 3. Monorepo Best Practices

- **Workspace-first approach** with internal package references
- **Shared configuration** via base TypeScript configs
- **Centralized tooling** with Turborepo task orchestration
- **Incremental builds** with proper dependency graphs

## Package Manager Configuration

### Root `.npmrc` Configuration

```ini
# Enforce pnpm usage in this monorepo
engine-strict=true

# pnpm configuration
dedupe-peer-dependents=false
strict-peer-dependencies=true
shared-workspace-lockfile=true
node-linker=isolated
prefer-workspace-packages=true
link-workspace-packages=true
```

**CRITICAL**: This configuration MUST remain unchanged. Any modifications require approval and documentation.

### Package Manager Versions

```json
{
  "engines": {
    "node": "22.20.0",
    "pnpm": "10.18.x"
  },
  "packageManager": "pnpm@10.18.1",
  "devEngines": {
    "runtime": {
      "name": "node",
      "version": "22.20.0"
    }
  }
}
```

## Workspace Structure

### Required Directory Structure

```
aibos-erpBOS/
├── apps/                    # Application packages
│   ├── main/               # Main application
│   ├── bff/                # Backend for Frontend
│   └── web/                # Web application
├── packages/                # Shared library packages
│   ├── auth/               # Authentication utilities
│   ├── utils/              # Common utilities
│   ├── tools/              # Development tools
│   └── contracts/          # API contracts
├── docs/                   # Documentation
├── scripts/                # Build and verification scripts
└── reports/                # Generated reports
```

### Workspace Configuration (`pnpm-workspace.yaml`)

```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

## Package Naming Conventions

### Package Names

| Package Type | Naming Pattern       | Example                       |
| ------------ | -------------------- | ----------------------------- |
| Applications | `@aibos/{app-name}`  | `@aibos/main`, `@aibos/bff`   |
| Libraries    | `@aibos/{lib-name}`  | `@aibos/auth`, `@aibos/utils` |
| Tools        | `@aibos/{tool-name}` | `@aibos/tools`                |

### Internal Dependencies

**MANDATORY**: All internal dependencies MUST use `workspace:*` protocol:

```json
{
  "dependencies": {
    "@aibos/auth": "workspace:*",
    "@aibos/utils": "workspace:*"
  }
}
```

## Version Management

### Syncpack Configuration (`.syncpackrc.json`)

The syncpack configuration enforces version consistency across all packages:

```json
{
  "versionGroups": [
    {
      "label": "Workspace packages",
      "packages": ["@aibos/*"],
      "dependencies": ["@aibos/*"],
      "isIgnored": true
    },
    {
      "label": "Core Development Tools",
      "packages": ["**"],
      "dependencies": [
        "typescript",
        "eslint",
        "prettier",
        "rimraf",
        "syncpack",
        "tsx",
        "dependency-cruiser",
        "turbo"
      ],
      "range": ""
    },
    {
      "label": "Next.js Ecosystem",
      "packages": ["**"],
      "dependencies": ["next"],
      "range": ""
    },
    {
      "label": "Validation & Schema",
      "packages": ["**"],
      "dependencies": ["zod"],
      "range": ""
    },
    {
      "label": "UI Components",
      "packages": ["**"],
      "dependencies": ["aibos-ui"],
      "range": "^"
    },
    {
      "label": "React Ecosystem",
      "packages": ["**"],
      "dependencies": [
        "react",
        "react-dom",
        "@types/react",
        "@types/react-dom"
      ],
      "range": "^"
    }
  ],
  "semverGroups": [
    {
      "label": "Exact versions for locked-down stack",
      "packages": ["**"],
      "dependencies": [
        "typescript",
        "eslint",
        "prettier",
        "rimraf",
        "syncpack",
        "tsx",
        "dependency-cruiser",
        "turbo",
        "next",
        "zod"
      ],
      "range": ""
    },
    {
      "label": "Caret ranges for UI and React",
      "packages": ["**"],
      "dependencies": [
        "aibos-ui",
        "react",
        "react-dom",
        "@types/react",
        "@types/react-dom",
        "@types/node"
      ],
      "range": "^"
    }
  ]
}
```

### Version Enforcement Rules

1. **Core Tools**: Exact versions (no ranges)
2. **UI Libraries**: Caret ranges (^) for minor updates
3. **Workspace Packages**: Always use `workspace:*`
4. **External Dependencies**: Follow syncpack groups

## Dependency Management

### Root Package Overrides

```json
{
  "pnpm": {
    "overrides": {
      "next": "15.5.4",
      "zod": "4.1.12",
      "eslint": "9.36.0",
      "prettier": "3.6.2",
      "rimraf": "6.0.1",
      "syncpack": "13.0.4",
      "tsx": "4.20.6",
      "typescript": "5.9.3"
    }
  }
}
```

### Dependency Categories

#### Core Dependencies (Root)

```json
{
  "dependencies": {
    "zod": "4.1.12"
  }
}
```

**IMPORTANT**: App-specific dependencies (React, Next.js, etc.) should be added to individual app packages, not the root.

#### Development Dependencies (Root)

```json
{
  "devDependencies": {
    "@eslint/eslintrc": "^3.3.1",
    "@eslint/js": "^9.37.0",
    "@typescript-eslint/eslint-plugin": "^8.46.0",
    "@typescript-eslint/parser": "^8.46.0",
    "dependency-cruiser": "16.0.0",
    "eslint": "9.36.0",
    "eslint-plugin-boundaries": "^5.0.2",
    "prettier": "3.6.2",
    "rimraf": "6.0.1",
    "syncpack": "13.0.4",
    "tsup": "^8.0.0",
    "tsx": "4.20.6",
    "turbo": "2.5.8",
    "typescript": "5.9.3"
  }
}
```

## Build Configuration

### Standard Package Structure

Every package MUST follow this structure:

```json
{
  "name": "@aibos/{package-name}",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "files": ["dist"],
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "sideEffects": false
}
```

### Build Scripts Standardization

#### Library Packages

```json
{
  "scripts": {
    "build": "rimraf dist && tsup src/index.ts --format esm,cjs --dts --sourcemap --clean",
    "type-check": "tsc -p tsconfig.build.json --noEmit",
    "clean": "rimraf dist"
  }
}
```

#### Application Packages

```json
{
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "rimraf dist && tsc -p tsconfig.build.json",
    "start": "node dist/index.js",
    "lint": "eslint .",
    "type-check": "tsc -p tsconfig.build.json --noEmit",
    "clean": "rimraf dist"
  }
}
```

## TypeScript Configuration

### Base Configuration (`tsconfig.base.json`)

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "moduleResolution": "Bundler",
    "module": "ESNext",
    "verbatimModuleSyntax": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@aibos/utils/*": ["packages/utils/src/*"],
      "@aibos/auth/*": ["packages/auth/src/*"],
      "@aibos/bff/*": ["apps/bff/src/*"]
    }
  }
}
```

### Package-Specific Build Config (`tsconfig.build.json`)

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules", "**/*.test.ts", "**/*.spec.ts"]
}
```

## Scripts Standardization

### Root Scripts (`package.json`)

```json
{
  "scripts": {
    "turbo:verify": "turbo run verify:* --filter=@aibos/tools",
    "turbo:verify:versions": "turbo run verify:versions --filter=@aibos/tools",
    "turbo:verify:syncpack": "turbo run verify:syncpack --filter=@aibos/tools",
    "turbo:verify:pkg-names": "turbo run verify:pkg-names --filter=@aibos/tools",
    "turbo:verify:ui-validation": "turbo run verify:ui-validation --filter=@aibos/tools",
    "verify:versions": "node scripts/verify/version-check.mjs",
    "verify:client": "node scripts/verify/client-gen.mjs",
    "verify:lint": "node scripts/verify/lint.mjs",
    "verify:types": "node scripts/verify/types.mjs",
    "syncpack:check": "pnpm -w exec syncpack list-mismatches",
    "syncpack:fix": "pnpm -w exec syncpack fix-mismatches",
    "verify:syncpack": "node scripts/verify/syncpack.mjs",
    "verify:pkg-names": "node scripts/verify/pkg-names.mjs",
    "verify:ui-validation": "node scripts/verify/ui-validation.mjs",
    "verify:depcruise": "node scripts/verify/depcruise.mjs",
    "depcruise": "depcruise --config .dependency-cruiser.cjs .",
    "contracts:check": "pnpm run verify:contracts",
    "client:gen": "pnpm run verify:client",
    "dev": "turbo run dev --filter=./apps/main",
    "build": "turbo run build",
    "test": "turbo run test",
    "clean": "turbo run clean && pnpm -w store prune",
    "ci:contracts": "pnpm run contracts:check",
    "store:prune": "pnpm store prune",
    "dedupe": "pnpm -w dedupe",
    "lint": "pnpm run verify:lint",
    "type-check": "pnpm run verify:types",
    "pre-commit": "powershell -File .git/hooks/pre-commit"
  }
}
```

## Quality Assurance

### Turborepo Configuration

#### Root Configuration (`turbo.json`)

The root configuration is minimal and focuses on verification tasks:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "build/**", "out/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**", ".vitest/**", "reports/test/**"]
    },
    "lint": {
      "outputs": []
    },
    "type-check": {
      "outputs": []
    },
    "clean": {
      "cache": false
    },
    "verify:versions": {
      "cache": true,
      "inputs": [
        "scripts/verify/version-check.mjs",
        "package.json",
        "pnpm-lock.yaml"
      ],
      "outputs": ["reports/version-check.json"]
    },
    "verify:syncpack": {
      "cache": true,
      "inputs": ["scripts/verify/syncpack.mjs", "package.json"],
      "outputs": ["reports/syncpack.json"]
    },
    "verify:pkg-names": {
      "cache": true,
      "inputs": [
        "scripts/verify/pkg-names.mjs",
        "packages/**/package.json",
        "apps/**/package.json"
      ],
      "outputs": ["reports/pkg-names.json"]
    },
    "verify:ui-validation": {
      "cache": true,
      "inputs": ["scripts/verify/ui-validation.mjs", "packages/**", "apps/**"],
      "outputs": ["reports/ui-validation.json"]
    },
    "verify:contracts": {
      "dependsOn": [],
      "inputs": [
        "scripts/verify/contracts.mjs",
        "packages/contracts/**",
        "openapi/**"
      ],
      "outputs": ["reports/contracts.json"]
    },
    "verify:client": {
      "dependsOn": ["verify:contracts"],
      "inputs": ["scripts/verify/client-gen.mjs", "packages/**/openapi/*.json"],
      "outputs": ["apps/**/generated/**", "packages/**/generated/**"]
    },
    "verify:lint": {
      "inputs": [
        "**/*.{js,ts,tsx,json,cjs,mjs}",
        "eslint.config.*",
        ".eslint*"
      ],
      "outputs": []
    },
    "verify:types": {
      "dependsOn": ["^build"],
      "inputs": ["**/*.ts", "**/*.tsx", "tsconfig*.json"],
      "outputs": []
    },
    "verify:depcruise": {
      "cache": true,
      "outputs": ["reports/depcruise.json"]
    },
    "depcruise": {
      "cache": true,
      "outputs": ["reports/depcruise/**"]
    }
  }
}
```

#### Package-Specific Configuration

Each package should have its own `turbo.json` with narrow inputs for optimal caching:

**Library Package (`packages/auth/turbo.json`):**

```json
{
  "extends": ["//"],
  "tasks": {
    "build": {
      "inputs": ["src/**", "package.json", "tsconfig*.json"],
      "outputs": ["dist/**"]
    }
  }
}
```

**Application Package (`apps/main/turbo.json`):**

```json
{
  "extends": ["//"],
  "tasks": {
    "build": {
      "inputs": ["src/**", "package.json", "tsconfig*.json"],
      "outputs": ["dist/**"]
    },
    "test": {
      "inputs": ["src/**", "vitest.config.*"]
    },
    "type-check": {
      "inputs": ["src/**", "tsconfig*.json"]
    }
  }
}
```

**CRITICAL**: Narrow inputs prevent cache misses and improve build performance.

## Enforcement Rules

### Pre-commit Hook Validation

The pre-commit hook enforces:

1. **Legacy File Detection**: No `.old`, `.backup`, `.bak`, `*~` files
2. **Duplicate Config Detection**: No duplicate `package.json`, `tsconfig.json`, `eslint.config.js`
3. **PowerShell Compatibility**: No `&&` operators in scripts
4. **Package Name Validation**: Consistent naming patterns
5. **Version Synchronization**: syncpack compliance

### Automated Checks

Run these commands to validate configuration:

```bash
# Check version consistency
pnpm run verify:versions

# Check syncpack compliance
pnpm run verify:syncpack

# Check package naming
pnpm run verify:pkg-names

# Check UI validation
pnpm run verify:ui-validation

# Check dependency architecture
pnpm run verify:depcruise

# Check linting
pnpm run verify:lint

# Check types
pnpm run verify:types
```

## Migration Guidelines

### Adding a New Package

1. **Create package directory** in `packages/` or `apps/`
2. **Initialize package.json** following the standard structure
3. **Add TypeScript configuration** extending base config
4. **Update workspace references** in `tsconfig.base.json`
5. **Add to syncpack groups** if needed
6. **Run verification scripts** to ensure compliance

### Updating Dependencies

1. **Update root package.json** first
2. **Update syncpack configuration** if adding new groups
3. **Run syncpack fix** to propagate changes
4. **Verify all packages** compile and pass tests
5. **Update documentation** if breaking changes

### Version Updates

1. **Update exact versions** in root overrides
2. **Update syncpack groups** for new ranges
3. **Run verification scripts** to catch issues
4. **Test all applications** for compatibility
5. **Update this document** if patterns change

## Compliance Checklist

Before committing any package changes, ensure:

- [ ] Package name follows `@aibos/{name}` convention
- [ ] Internal dependencies use `workspace:*`
- [ ] Build scripts follow standard patterns
- [ ] TypeScript config extends base configuration
- [ ] Version ranges comply with syncpack groups
- [ ] All verification scripts pass
- [ ] No legacy files present
- [ ] PowerShell compatibility maintained
- [ ] Documentation updated if needed

## Emergency Procedures

### Configuration Drift Recovery

If configuration drift is detected:

1. **Stop all development** immediately
2. **Run full verification suite**: `pnpm run turbo:verify`
3. **Identify drift sources** using syncpack and verification reports
4. **Apply fixes systematically** following this document
5. **Re-run verification** until all checks pass
6. **Document the incident** and prevention measures

### Rollback Procedures

If a configuration change causes issues:

1. **Revert to last known good commit**
2. **Run verification scripts** to confirm stability
3. **Analyze the problematic change**
4. **Update this document** with lessons learned
5. **Implement additional safeguards** if needed

---

## Document Maintenance

This document MUST be updated whenever:

- New package patterns are established
- Dependency versions are updated
- Build processes change
- New verification rules are added
- Configuration drift is discovered

**Last Updated**: 2025-01-07
**Version**: 1.0.0
**Maintainer**: AI-BOS Development Team
