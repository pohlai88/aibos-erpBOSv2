import {
    pgTable,
    serial,
    varchar,
    integer,
    timestamp,
    boolean,
    pgEnum,
} from 'drizzle-orm/pg-core';

/**
 * Core Ledger Schema - Chart of Accounts
 * Multi-tenant enabled with RLS policies
 */

export const accountTypeEnum = pgEnum('account_type', [
    'ASSET',
    'LIABILITY',
    'EQUITY',
    'REVENUE',
    'EXPENSE',
]);

export const normalBalanceEnum = pgEnum('normal_balance', ['DEBIT', 'CREDIT']);

export const accountsTable = pgTable('accounts', {
    id: serial('id').primaryKey(),
    tenantId: varchar('tenant_id', { length: 255 }).notNull(),
    code: varchar('code', { length: 50 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    parentId: integer('parent_id'), // Self-reference FK defined in SQL migration
    accountType: accountTypeEnum('account_type').notNull(),
    normalBalance: normalBalanceEnum('normal_balance').notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('USD'),
    isActive: boolean('is_active').default(true).notNull(),
    allowPosting: boolean('allow_posting').default(true).notNull(),
    level: integer('level').notNull().default(1),
    effectiveStartDate: timestamp('effective_start_date').defaultNow().notNull(),
    effectiveEndDate: timestamp('effective_end_date'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    createdBy: varchar('created_by', { length: 255 }).notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    updatedBy: varchar('updated_by', { length: 255 }).notNull(),
});

// Export type for TypeScript inference
export type Account = typeof accountsTable.$inferSelect;
export type NewAccount = typeof accountsTable.$inferInsert;
