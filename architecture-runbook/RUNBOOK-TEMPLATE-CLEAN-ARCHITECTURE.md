# 🏗️ AIBOS Clean Architecture Runbook Template (v2, aligned to M01)

> Use this as your **single, canonical template** for all modules. It mirrors the M01 Core Ledger runbook structure and codifies the best‑practice improvements (policy instance methods, derived invariants, strict contracts, DB constraints, DI, testing gates). Replace placeholders like `<MODULE>`, `<Entity>`, and `<…>`.

---

## 📋 Module: `<MODULE_NAME>` (M`<MODULE_ID>`)

**Status**: 🚧 **In Development**  
**Architecture Compliance**: ✅ **8‑Layer Clean Architecture**  
**Last Updated**: `<YYYY‑MM‑DD>`  
**Owner**: `<OWNER_NAME>`

---

## 🎯 Executive Summary

### Business Value
- **Primary Function**: `<MODULE_DESCRIPTION>`
- **Business Impact**: `<BUSINESS_IMPACT>`
- **User Personas**: `<USER_PERSONAS>`
- **Success Metrics**: `<SUCCESS_METRICS>`

### Architecture Compliance
This module **strictly follows** the AIBOS 8‑layer clean architecture:

```
DB → Adapters → Ports → Services → Policies → Contracts → API → UI
```

**✅ Zero architectural violations allowed**

---

## 🏗️ 8‑Layer Architecture Implementation

### Layer 1: Database (DB)
**Location**: `packages/adapters/db/<module>/`  
**Responsibility**: Data persistence, schema, migrations

```ts
// packages/adapters/db/<module>/schema.ts
import { pgTable, serial, varchar, integer, timestamp, boolean } from 'drizzle-orm/pg-core';

export const <entity>Table = pgTable('<entity_plural>', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  parentId: integer('parent_id'), // FK as needed
  // Example invariant field (see Services for derivation pattern)
  // normalState: varchar('normal_state', { length: 16 }).notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

```sql
-- packages/adapters/db/<module>/migrations/001_create_<entity_plural>_table.sql
CREATE TABLE <entity_plural> (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  parent_id INTEGER,
  -- normal_state VARCHAR(16) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Recommended integrity checks (adapt to your domain)
-- ALTER TABLE <entity_plural> ADD CONSTRAINT chk_normal_state
--   CHECK (normal_state IN ('DEBIT','CREDIT'));

CREATE INDEX idx_<entity>_code ON <entity_plural>(code);
CREATE INDEX idx_<entity>_active ON <entity_plural>(is_active);
```

**Optional DB hardening**
- Multi‑tenant: add `tenant_id`, unique `(tenant_id, code)`, enable RLS
- Hierarchy: add `path` (materialized path) or PostgreSQL `ltree` for fast subtree queries
- Audit: `created_by`, `updated_by`

---

### Layer 2: Adapters
**Location**: `packages/adapters/<module>/`  
**Responsibility**: Data access and transformations to/from DB (no business rules)

```ts
// packages/adapters/<module>/<entity>-adapter.ts
import { eq, and, like } from 'drizzle-orm';
import { <entity>Table } from '@aibos/adapters/db/<module>/schema';

export class <Entity>Adapter implements <Entity>Repository {
  constructor(private db: Database) {}

  async create(data: Create<Entity>Data): Promise<<Entity>> {
    const [row] = await this.db.insert(<entity>Table)
      .values({ ...data, createdAt: new Date(), updatedAt: new Date() })
      .returning();
    return row;
  }

  async findById(id: number) { /* … */ }
  async findByCode(code: string) { /* … */ }
  async search(query: string, filters: SearchFilters = {}) { /* … */ }
  async update(id: number, data: Update<Entity>Data) { /* … */ }
  async archive(id: number) { /* … */ }
  async reparent(entityId: number, newParentId: number | null) { /* … */ }
}
```

---

### Layer 3: Ports
**Location**: `packages/ports/<module>/`  
**Responsibility**: Interfaces (dependency inversion), pure types

```ts
// packages/ports/<module>/<entity>-port.ts
export type EntityKind = 'KIND_A' | 'KIND_B' | 'KIND_C'; // replace with domain enums
export type NormalState = 'DEBIT' | 'CREDIT'; // example invariant pattern

export interface <Entity> {
  id: number;
  code: string;
  name: string;
  parentId?: number;
  kind: EntityKind;
  normalState: NormalState; // invariant persisted
  isActive: boolean;
  createdAt: Date; updatedAt: Date;
}

export interface Create<Entity>Data {
  code: string; name: string; parentId?: number; kind: EntityKind;
  normalState?: NormalState; // service derives if omitted
}

export interface Update<Entity>Data {
  code?: string; name?: string; parentId?: number; kind?: EntityKind;
  normalState?: NormalState; isActive?: boolean;
}

export interface SearchFilters { kind?: EntityKind; isActive?: boolean; }

export interface <Entity>Repository {
  create(data: Create<Entity>Data): Promise<<Entity>>;
  findById(id: number): Promise<<Entity> | null>;
  findByCode(code: string): Promise<<Entity> | null>;
  search(q: string, filters?: SearchFilters): Promise<<Entity>[]>;
  update(id: number, data: Update<Entity>Data): Promise<<Entity>>;
  archive(id: number): Promise<<Entity>>;
  reparent(id: number, newParentId: number | null): Promise<<Entity>>;
}

export interface <Entity>Service {
  create(data: Create<Entity>Request): Promise<<Entity>Response>;
  get(id: number): Promise<<Entity>Response>;
  search(q: string, filters?: SearchFilters): Promise<<Entity>Response[]>;
  update(id: number, data: Update<Entity>Request): Promise<<Entity>Response>;
  archive(id: number): Promise<void>;
  reparent(id: number, newParentId: number | null): Promise<<Entity>Response>;
  validateReparent(id: number, newParentId: number | null): Promise<ReparentValidationResponse>;
}
```

---

### Layer 4: Services
**Location**: `packages/services/<module>/`  
**Responsibility**: Business logic (policies enforced here), invariants

```ts
// packages/services/<module>/<entity>-service.ts
import type { <Entity>Repository, <Entity>Service, SearchFilters, Update<Entity>Data } from '@aibos/ports/<module>/<entity>-port';
import { <Entity>Policies } from '@aibos/policies/<module>/<entity>-policies';
import { Logger } from '@aibos/ports/shared/logger-port';

export class <Entity>ServiceImpl implements <Entity>Service {
  constructor(
    private repo: <Entity>Repository,
    private policies: <Entity>Policies, // INSTANCE methods
    private logger: Logger
  ) {}

  async create(data: Create<Entity>Request): Promise<<Entity>Response> {
    this.logger.info('<Entity>.create', { code: data.code });
    await this.policies.validateCreate(data);

    const existing = await this.repo.findByCode(data.code);
    if (existing) throw new BusinessError('<Entity> code already exists');

    if (data.parentId) await this.policies.validateParentChild(await this.expect(data.parentId), data);

    // **Derived invariant pattern (M01 style)**
    const normalState: NormalState = this.deriveNormalState(data.kind);

    const entity = await this.repo.create({ ...data, normalState });
    return this.map(entity);
  }

  async update(id: number, data: Update<Entity>Request): Promise<<Entity>Response> {
    await this.policies.validateUpdate(data);
    await this.expect(id);

    // Auto‑adjust invariant when driver field changes
    let patch: Update<Entity>Data = { ...data };
    if (data.kind && patch.normalState === undefined) patch.normalState = this.deriveNormalState(data.kind);

    const updated = await this.repo.update(id, patch);
    return this.map(updated);
  }

  // helpers
  private deriveNormalState(kind: EntityKind): NormalState {
    return kind === 'KIND_A' || kind === 'KIND_C' ? 'DEBIT' : 'CREDIT'; // adapt per domain
  }

  private async expect(id: number) { const x = await this.repo.findById(id); if (!x) throw new NotFoundError('<Entity> not found'); return x; }
  private map(e: <Entity>): <Entity>Response { /* map Dates → ISO strings */ return { /* … */ } }
}
```

---

### Layer 5: Policies
**Location**: `packages/policies/<module>/`  
**Responsibility**: Business rules, validation, constraints (**instance methods**, not static)

```ts
// packages/policies/<module>/<entity>-policies.ts
export class <Entity>Policies {
  async validateCreate(data: Create<Entity>Request): Promise<void> {
    if (!data.code || data.code.length < 3) throw new ValidationError('Code must be ≥ 3 chars');
    if (!/^[A-Z0-9-]+$/.test(data.code)) throw new ValidationError('Code must be A‑Z, 0‑9, hyphen');
    if (!data.name || data.name.length < 5) throw new ValidationError('Name must be ≥ 5 chars');
    // domain enums validated upstream by Contracts (Zod), re‑assert here if needed
  }

  async validateUpdate(data: Update<Entity>Request): Promise<void> { /* …as above… */ }

  async validateParentChild(parent: <Entity>, child: Create<Entity>Request): Promise<void> {
    // Example: only same kind allowed
    if (parent.kind !== child.kind) throw new ValidationError('Parent/child kind mismatch');
    // Example: code prefix rule
    if (!child.code.startsWith(parent.code)) throw new ValidationError('Child code must start with parent code');
    // Example: depth limit (ensure parent.level < MAX)
  }

  async validateArchive(entity: <Entity>): Promise<void> {
    if (!entity.isActive) throw new ValidationError('Already archived');
    // add: has children? non‑zero balance? open period? delegate checks to services
  }
}
```

---

### Layer 6: Contracts
**Location**: `packages/contracts/<module>/`  
**Responsibility**: API contracts, types, schemas (strict unions)

```ts
// packages/contracts/<module>/types.ts
export type EntityKind = 'KIND_A' | 'KIND_B' | 'KIND_C';
export type NormalState = 'DEBIT' | 'CREDIT';

export interface Create<Entity>Request { code: string; name: string; parentId?: number; kind: EntityKind; }
export interface Update<Entity>Request { code?: string; name?: string; parentId?: number; kind?: EntityKind; isActive?: boolean; }

export interface <Entity>Response {
  id: number; code: string; name: string; parentId?: number;
  kind: EntityKind; normalState: NormalState; isActive: boolean;
  createdAt: string; updatedAt: string;
}
```

```ts
// packages/contracts/<module>/schemas.ts
import { z } from 'zod';

export const create<Entity>Schema = z.object({
  code: z.string().min(3).max(50).regex(/^[A-Z0-9-]+$/),
  name: z.string().min(5).max(255),
  parentId: z.number().positive().optional(),
  kind: z.enum(['KIND_A','KIND_B','KIND_C']),
});

export const update<Entity>Schema = z.object({
  code: z.string().min(3).max(50).regex(/^[A-Z0-9-]+$/).optional(),
  name: z.string().min(5).max(255).optional(),
  parentId: z.number().positive().optional(),
  kind: z.enum(['KIND_A','KIND_B','KIND_C']).optional(),
  isActive: z.boolean().optional(),
});

export const <entity>ResponseSchema = z.object({
  id: z.number(), code: z.string(), name: z.string(), parentId: z.number().optional(),
  kind: z.enum(['KIND_A','KIND_B','KIND_C']),
  normalState: z.enum(['DEBIT','CREDIT']),
  isActive: z.boolean(), createdAt: z.string(), updatedAt: z.string(),
});
```

---

### Layer 7: API (BFF)
**Location**: `apps/bff/app/api/<module>/`  
**Responsibility**: HTTP endpoints, DI, request/response handling

```ts
// apps/bff/app/api/<module>/route.ts
import { <Entity>ServiceImpl } from '@aibos/services/<module>/<entity>-service';
import { <Entity>Adapter } from '@aibos/adapters/<module>/<entity>-adapter';
import { <Entity>Policies } from '@aibos/policies/<module>/<entity>-policies';
import { create<Entity>Schema } from '@aibos/contracts/<module>/schemas';
import { Logger } from '@aibos/adapters/shared/logger-adapter';

export async function POST(request: Request) {
  try {
    const data = create<Entity>Schema.parse(await request.json());
    const service = new <Entity>ServiceImpl(new <Entity>Adapter(db), new <Entity>Policies(), new Logger());
    const result = await service.create(data);
    return Response.json(result, { status: 201 });
  } catch (err) { return handleApiError(err); }
}
```

> **Note:** Prefer a small **route factory** to centralize DI for consistency and testability.

---

### Layer 8: UI
**Location**: `apps/web/app/(dashboard)/<module>/`  
**Responsibility**: UX (consume Contracts; no business rules)

```tsx
// apps/web/app/(dashboard)/<module>/page.tsx
'use client';
import { use<Entity>Query, useCreate<Entity>, useUpdate<Entity> } from '@/hooks/<module>/<entity>-hooks';
import { <Entity>Form } from '@/components/<module>/<entity>-form';
import { Button, Tabs } from 'aibos-ui';

export default function <Module>Page() {
  const { data, isLoading, error } = use<Entity>Query();
  const createEntity = useCreate<Entity>();
  const updateEntity = useUpdate<Entity>();
  // … render list/forms following Contracts types
}
```

---

## 🚫 Architectural Violations Prevention

### ESLint boundary rules (apply org‑wide)
```js
// .eslintrc.js (excerpt)
module.exports = {
  rules: {
    'no-restricted-imports': ['error', { patterns: [
      { group: ['apps/bff/app/lib/*'], message: 'API cannot import BFF internals' },
      { group: ['apps/bff/app/services/*'], message: 'API cannot import BFF services' },
    ]}],
    'import/no-restricted-paths': ['error', { zones: [
      { target: './apps/bff/app/api/**', from: './apps/bff/app/lib/**', message: 'API → BFF lib forbidden' },
      { target: './apps/bff/app/api/**', from: './apps/bff/app/services/**', message: 'API → BFF services forbidden' },
      { target: './packages/services/**', from: './apps/bff/**', message: 'Services cannot import BFF files' },
    ]}],
  }
};
```

### Dependency Injection pattern
```ts
export class <Entity>ServiceImpl {
  constructor(
    private repo: <Entity>Repository,
    private policies: <Entity>Policies,
    private logger: Logger
  ) {}
}
```

---

## 🧪 Testing Strategy

- **Unit**: Services (invariant derivation), Policies (instance methods), Adapters (DB mocks)
- **Integration**: API routes (Zod validation → Service → Adapter)
- **E2E (optional)**: UI flows using Contracts types

```ts
// packages/services/<module>/__tests__/<entity>-service.test.ts
it('derives invariant on create and on kind change', async () => { /* … */ });
```

---

## 📊 Quality Gates

**Architecture**  
- [ ] Zero ESLint boundary violations  
- [ ] All 8 layers present with DI  
- [ ] Policies use **instance** methods  

**Type/Contracts**  
- [ ] Strict unions in Contracts (no bare `string`)  
- [ ] Zod schemas match types  

**Data Integrity**  
- [ ] DB constraints for enums/invariants  
- [ ] Optional multi‑tenant RLS in place

**Tests**  
- [ ] ≥ 90% coverage Services/Policies  
- [ ] Invariant derivation tests green

**Perf**  
- [ ] API p95 < 200ms  
- [ ] Hierarchy ops scale to target size

---

## 🚀 Implementation Checklist

**Phase 1: Foundation**  
- [ ] Schema + migrations  
- [ ] Adapter repo API  
- [ ] Ports interfaces  
- [ ] ESLint boundaries enabled

**Phase 2: Business Logic**  
- [ ] Service invariants + policies  
- [ ] Contracts + Zod  
- [ ] Unit tests

**Phase 3: API & UI**  
- [ ] API handlers (with DI factory)  
- [ ] UI pages + hooks  
- [ ] Integration tests

**Phase 4: Deployment**  
- [ ] Feature flag  
- [ ] Monitoring & alerts  
- [ ] Docs & runbook  
- [ ] Production deploy

---

## 🔄 Rollback Procedures

**Immediate (<5m)**
```bash
pnpm feature:disable <MODULE>_NEW_ARCH
pnpm deploy:rollback
pnpm health:check
```

**Data**
```bash
pnpm db:migrate:rollback
pnpm db:restore:backup
```

---

## 📈 Success Metrics

**Technical**: 100% architecture compliance, ≥90% coverage, p95 < 200ms, 99.9% uptime  
**Business**: adoption %, satisfaction score, efficiency/ROI deltas

---

## 📚 References
- AIBOS Architecture & Boundary Guardrails (org‑wide)
- Contracts & Testing Standards (org‑wide)

---

### 🧩 How to instantiate this template for a new module in 5 steps
1) **Search/replace** `<module>`, `<Module>`, `<Entity>` across this file and code blocks.  
2) Pick your **domain enums** (replace `EntityKind`, `NormalState`).  
3) Encode **derived invariant** logic in the Service (use M01 pattern).  
4) Add **DB constraints** to enforce the invariant at the database.  
5) Wire **route factory** + tests; run ESLint boundaries & coverage gates.

