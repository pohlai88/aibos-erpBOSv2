# AI-BOS ERP Business Operating System

## Cursor Rules Enforcement System

This project implements a comprehensive Cursor Rules enforcement system to maintain code quality, consistency, and team standards across the entire codebase.

### 🚀 Quick Start

```powershell
# Install dependencies
pnpm install

# Run verification
pnpm run verify

# Run architecture validation
pnpm run depcruise
```

### 📋 Rule Types

#### Always-Apply Rules (`.cursor/rules/*.mdc`)
- **file-management.mdc** - Mandatory file cleanup standards
- **code-quality.mdc** - Architecture and quality enforcement  
- **powershell-compatibility.mdc** - Windows PowerShell compatibility

#### Auto-Attached Rules
- **ui-standards.mdc** - Applied to UI files (`.tsx`, `.ts`, `.jsx`, `.js`, `.css`, `.scss`)
- **version-management.mdc** - Applied to config files (`.json`, `.js`, `.cjs`, `.ts`, `.yml`, `.yaml`)

### 🔧 Enforcement Mechanisms

#### Pre-commit Hook
- Checks for legacy files before commits
- Validates duplicate config files
- PowerShell-compatible for Windows
- Located at `.git/hooks/pre-commit`

#### Package Scripts
```json
{
  "scripts": {
    "verify": "pnpm -w contracts:check && pnpm -w client:gen && pnpm -w depcruise",
    "depcruise": "depcruise --config .dependency-cruiser.cjs . || exit 1"
  }
}
```

### 🛠️ Manual Enforcement Commands

#### Check for Legacy Files
```powershell
Get-ChildItem -Recurse -Include "*.old", "*.backup", "*.bak", "*~" | Where-Object { $_.FullName -notlike "*node_modules*" }
```

#### Validate Architecture
```powershell
pnpm run depcruise
```

#### Run Full Verification
```powershell
pnpm run verify
```

### 🏗️ Architecture Standards

#### Monorepo Structure
- **Turborepo** as task runner
- **pnpm** as package manager and workspace manager
- **uv** for Python task runner (speed optimization)

#### Development Commands
- Start auth package: `pnpm --filter @aibos/auth dev`
- Install packages: `pnpm install`
- Store management: `pnpm store prune`, `pnpm -w dedupe`
- CI commands: `pnpm -w test`, `pnpm run ci:contracts`, `pnpm -w build`

### 🎨 UI Standards

#### Design System
- **Dark-first theme** approach
- **WCAG 2.2 AAA** accessibility compliance
- **Enhanced-token or index.css** for all styling
- **Standard premium Tailwind** configuration
- **No hardcoded styles**

#### Component Architecture
- Multiple small, domain-specific app shells
- Kernel-UI platform v2.0 boilerplate
- Battle-tested architecture patterns
- Performance metrics: 716KB bundle, <350ms response time

### 📅 Version Management

#### Date Format Standards
- **ISO 8601** date format enforced across all config files
- Consistency maintained project-wide

#### Configuration Management
- Single source of truth (SSOT) principles
- Textbook configuration as SSOT
- Version-controlled rules in `.cursor/rules/`

### 🔍 Quality Gates

#### Testing Requirements
- **95% test coverage** across all features and functions
- Comprehensive test coverage validation
- Functionality-focused testing approach

#### Code Quality
- TypeScript compliance and linting
- Dependency-cruiser architecture validation
- Import-linter, ruff, and mypy for Python tests
- Clean architecture patterns enforcement

### ⚡ PowerShell Compatibility

#### Command Standards
- **Never use `&&`** operator for command chaining
- **Use `;` or separate commands** instead
- PowerShell-friendly syntax for all terminal instructions
- Windows development environment compatibility

### 🚨 Rule Violation Handling

#### Immediate Actions
1. **STOP** - Don't proceed with violating actions
2. **CLEAN** - Remove legacy files immediately
3. **VERIFY** - Run linting and type checks
4. **ASK** - Request clarification when unclear

#### Escalation
- If rules conflict with requirements, discuss with team
- Update rules if patterns change
- Document exceptions with clear reasoning

### ✅ Benefits

- **Automatic Enforcement** - Rules apply without manual intervention
- **Context-Aware** - Different rules for different file types
- **Team Consistency** - Same rules for all developers
- **Version Controlled** - Rules evolve with the project
- **PowerShell Compatible** - Works on Windows development environment
- **Pre-commit Validation** - Catches issues before they reach the repository

### 📚 Additional Resources

- [Cursor Rules Enforcement Guide](./CURSOR_RULES_ENFORCEMENT.md)
- [Architecture Runbook](./architecture-runbook/)
- [UI Runbook](./ui-runbook/)

---

**Note**: This system ensures consistent, high-quality code across the entire AI-BOS ERP platform while maintaining compatibility with Windows PowerShell development environments.
