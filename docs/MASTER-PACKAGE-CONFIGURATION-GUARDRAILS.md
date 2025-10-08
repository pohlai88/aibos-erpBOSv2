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
- **Unified TypeScript configuration** with no package-level overrides of core settings

### 2. Production-Ready Standards

- **Exact version pinning** for core dependencies
- **Comprehensive type safety** with strict TypeScript configuration
- **Automated quality checks** via pre-commit hooks
- **Dependency isolation** using pnpm's isolated node linker
- **Automated drift detection** preventing configuration inconsistencies

### 3. Monorepo Best Practices

- **Workspace-first approach** with internal package references
- **Shared configuration** via base TypeScript configs
- **Centralized tooling** with Turborepo task orchestration
- **Incremental builds** with proper dependency graphs
- **Single source of truth** for all compiler settings

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
      "next": "14.2.x",
      "react": "18.2.0",
      "react-dom": "18.2.0",
      "@tanstack/react-query": "5.x",
      "drizzle-orm": "0.34.x",
      "drizzle-kit": "0.25.x",
      "postgres": "3.4.x",
      "pino": "9.x",
      "typescript": "5.5.x",
      "zod": "4.1.12",
      "eslint": "9.36.0",
      "prettier": "3.6.2",
      "rimraf": "6.0.1",
      "syncpack": "13.0.4",
      "tsx": "4.20.6"
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
    "@vitest/coverage-v8": "^3.2.4",
    "dependency-cruiser": "16.0.0",
    "drizzle-kit": "~0.25.0",
    "eslint": "9.36.0",
    "eslint-plugin-boundaries": "^5.0.2",
    "happy-dom": "^19.0.2",
    "prettier": "3.6.2",
    "rimraf": "6.0.1",
    "syncpack": "13.0.4",
    "tsup": "^8.0.0",
    "tsx": "4.20.6",
    "turbo": "2.5.8",
    "typescript": "5.5.4",
    "vitest": "^3.2.4"
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

**CRITICAL**: This is the single source of truth for all TypeScript compiler settings. No package may override core settings.

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "verbatimModuleSyntax": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "incremental": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@aibos/utils/*": ["packages/utils/src/*"],
      "@aibos/auth/*": ["packages/auth/src/*"],
      "@aibos/bff/*": ["apps/bff/src/*"],
      "@aibos/contracts/*": ["packages/contracts/src/*"],
      "@aibos/services/*": ["packages/services/src/*"],
      "@aibos/ports/*": ["packages/ports/src/*"],
      "@aibos/adapters/*": ["packages/adapters/src/*"],
      "@aibos/policies/*": ["packages/policies/src/*"]
    },
    "tsBuildInfoFile": "./.cache/tsconfig.tsbuildinfo"
  }
}
```

### Package IDE Configuration (`tsconfig.json`)

**For IDE support only** - inherits all settings from base:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "tsBuildInfoFile": "./.cache/tsconfig.tsbuildinfo"
  },
  "include": ["src"],
  "references": [{ "path": "../ports" }]
}
```

### Package Build Configuration (`tsconfig.build.json`)

**For compilation and build** - extends base with build-specific settings:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "rootDir": "./src",
    "outDir": "./dist",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "tsBuildInfoFile": "./.cache/tsconfig.tsbuildinfo"
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules", "**/*.test.ts", "**/*.spec.ts"]
}
```

### Application Configuration

**Apps may only override JSX setting** for Next.js compatibility:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "preserve",
    "tsBuildInfoFile": "./.cache/tsconfig.tsbuildinfo"
  },
  "include": ["app", "src", "pages", "components", "next-env.d.ts"]
}
```

### TypeScript Configuration Rules

1. **NO ROOT `tsconfig.json`** - Only `tsconfig.base.json` exists at root
2. **ALL packages MUST extend** `tsconfig.base.json`
3. **NO overrides** of core settings (`moduleResolution`, `module`, `strict`, etc.)
4. **Apps may only override** `jsx` setting
5. **Build configs may override** build-specific settings only
6. **Unified buildInfo location** in `./.cache/tsconfig.tsbuildinfo`

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
    "verify:tsconfig-drift": "node scripts/verify/tsconfig-drift.mjs",
    "syncpack:check": "pnpm -w exec syncpack list-mismatches",
    "syncpack:fix": "pnpm -w exec syncpack fix-mismatches",
    "verify:syncpack": "node scripts/verify/syncpack.mjs",
    "verify:pkg-names": "node scripts/verify/pkg-names.mjs",
    "verify:ui-validation": "node scripts/verify/ui-validation.mjs",
    "verify:depcruise": "node scripts/verify/depcruise.mjs",
    "depcruise": "depcruise --config .dependency-cruiser.cjs .",
    "contracts:check": "pnpm run verify:contracts",
    "client:gen": "pnpm run verify:client",
    "dev": "turbo run dev",
    "build": "turbo run build",
    "typecheck": "turbo run typecheck",
    "test": "vitest run --coverage",
    "clean": "turbo run clean && pnpm -w store prune",
    "ci:contracts": "pnpm run contracts:check",
    "store:prune": "pnpm store prune",
    "dedupe": "pnpm -w dedupe",
    "lint": "pnpm run verify:lint",
    "type-check": "pnpm run verify:tsconfig-drift && pnpm run verify:types",
    "pre-commit": "powershell -File .git/hooks/pre-commit",
    "fix:deps": "pnpm install --frozen-lockfile=false && pnpm dedupe",
    "postinstall": "echo 'Postinstall completed'"
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
# Check TSConfig drift (CRITICAL - runs first)
pnpm run verify:tsconfig-drift

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

# Check types (includes drift check)
pnpm run type-check
```

### TSConfig Drift Detection

The `verify:tsconfig-drift` script enforces SSOT compliance by:

1. **Validating core settings** across all packages
2. **Preventing overrides** of critical compiler options
3. **Allowing only approved exceptions** (JSX for apps, build settings)
4. **Failing CI/CD** if drift is detected
5. **Providing clear error messages** for violations

**Enforced Settings:**

- `moduleResolution: "bundler"`
- `module: "ESNext"`
- `strict: true`
- `verbatimModuleSyntax: true`
- `skipLibCheck: true`
- `noUncheckedIndexedAccess: true`
- `exactOptionalPropertyTypes: true`

## Migration Guidelines

### Adding a New Package

1. **Create package directory** in `packages/` or `apps/`
2. **Initialize package.json** following the standard structure
3. **Create `tsconfig.json`** extending base config (IDE support)
4. **Create `tsconfig.build.json`** extending base config (build)
5. **Update workspace references** in `tsconfig.base.json` paths
6. **Add to syncpack groups** if needed
7. **Run verification scripts** to ensure compliance:
   ```bash
   pnpm run verify:tsconfig-drift
   pnpm run type-check
   ```

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
- [ ] **TypeScript config extends base configuration** (NO overrides)
- [ ] **Both `tsconfig.json` and `tsconfig.build.json` exist** for packages
- [ ] **No root `tsconfig.json`** (only `tsconfig.base.json`)
- [ ] Version ranges comply with syncpack groups
- [ ] **TSConfig drift check passes**: `pnpm run verify:tsconfig-drift`
- [ ] All verification scripts pass
- [ ] No legacy files present
- [ ] PowerShell compatibility maintained
- [ ] Documentation updated if needed

## Emergency Procedures

### Configuration Drift Recovery

If configuration drift is detected:

1. **Stop all development** immediately
2. **Run TSConfig drift check**: `pnpm run verify:tsconfig-drift`
3. **Identify drift sources** using verification reports
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
**Version**: 2.0.0
**Maintainer**: AI-BOS Development Team

---

## Changelog

### Version 2.0.0 (2025-01-07)

- **BREAKING**: Implemented TSConfig drift prevention system
- **BREAKING**: Removed root `tsconfig.json` in favor of `tsconfig.base.json` only
- **BREAKING**: Enforced strict TypeScript settings across all packages
- **NEW**: Added `verify:tsconfig-drift` script for automated compliance checking
- **NEW**: Separated IDE (`tsconfig.json`) and build (`tsconfig.build.json`) configurations
- **NEW**: Unified `tsBuildInfoFile` locations to `./.cache/tsconfig.tsbuildinfo`
- **IMPROVED**: Updated dependency versions to match actual project state
- **IMPROVED**: Enhanced enforcement rules and compliance checklist
