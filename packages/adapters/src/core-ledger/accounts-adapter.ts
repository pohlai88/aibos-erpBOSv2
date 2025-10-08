import { eq, and, like } from 'drizzle-orm';
import type { Database } from '../db/connection';
import { accountsTable } from '../db/core-ledger/schema';
import type {
    Account,
    AccountsRepository,
    CreateAccountData,
    UpdateAccountData,
    SearchFilters,
} from '@aibos/ports/core-ledger/accounts-port';

/**
 * Accounts Adapter - Repository implementation using Drizzle ORM
 * Handles all database interactions for accounts
 */
export class AccountsAdapter implements AccountsRepository {
    constructor(private db: Database) { }

    async create(data: CreateAccountData): Promise<Account> {
        const level = data.parentId ? await this.calculateLevel(data.parentId, data.tenantId) : 1;

        const [account] = await this.db
            .insert(accountsTable)
            .values({
                tenantId: data.tenantId,
                code: data.code,
                name: data.name,
                parentId: data.parentId ?? null,
                accountType: data.accountType,
                normalBalance: data.normalBalance,
                currency: data.currency ?? 'USD',
                allowPosting: data.allowPosting ?? true,
                isActive: true,
                level,
                effectiveStartDate: new Date(),
                createdAt: new Date(),
                createdBy: data.createdBy,
                updatedAt: new Date(),
                updatedBy: data.updatedBy,
            })
            .returning();

        if (!account) {
            throw new Error('Failed to create account');
        }

        return this.mapToAccount(account);
    }

    async findById(id: number, tenantId: string): Promise<Account | null> {
        const [account] = await this.db
            .select()
            .from(accountsTable)
            .where(and(eq(accountsTable.id, id), eq(accountsTable.tenantId, tenantId)))
            .limit(1);

        return account ? this.mapToAccount(account) : null;
    }

    async findByCode(code: string, tenantId: string): Promise<Account | null> {
        const [account] = await this.db
            .select()
            .from(accountsTable)
            .where(and(eq(accountsTable.code, code), eq(accountsTable.tenantId, tenantId)))
            .limit(1);

        return account ? this.mapToAccount(account) : null;
    }

    async findChildren(parentId: number, tenantId: string): Promise<Account[]> {
        const accounts = await this.db
            .select()
            .from(accountsTable)
            .where(and(eq(accountsTable.parentId, parentId), eq(accountsTable.tenantId, tenantId)));

        return accounts.map(acc => this.mapToAccount(acc));
    }

    async findHierarchy(tenantId: string): Promise<Account[]> {
        const accounts = await this.db
            .select()
            .from(accountsTable)
            .where(and(eq(accountsTable.isActive, true), eq(accountsTable.tenantId, tenantId)))
            .orderBy(accountsTable.level, accountsTable.code);

        return accounts.map(acc => this.mapToAccount(acc));
    }

    async search(
        query: string,
        tenantId: string,
        filters: SearchFilters = {}
    ): Promise<Account[]> {
        const conditions = [
            eq(accountsTable.tenantId, tenantId),
            eq(accountsTable.isActive, true),
        ];

        // Add search term (name or code)
        if (query) {
            conditions.push(
                like(accountsTable.name, `%${query}%`)
                // Note: Drizzle doesn't support OR easily, so we search by name only
                // For production, consider using PostgreSQL full-text search
            );
        }

        if (filters.accountType !== undefined) {
            conditions.push(eq(accountsTable.accountType, filters.accountType));
        }

        if (filters.currency !== undefined) {
            conditions.push(eq(accountsTable.currency, filters.currency));
        }

        if (filters.isActive !== undefined) {
            conditions.push(eq(accountsTable.isActive, filters.isActive));
        }

        if (filters.allowPosting !== undefined) {
            conditions.push(eq(accountsTable.allowPosting, filters.allowPosting));
        }

        const accounts = await this.db
            .select()
            .from(accountsTable)
            .where(and(...conditions));

        return accounts.map((acc) => this.mapToAccount(acc));
    }

    async update(id: number, tenantId: string, data: UpdateAccountData): Promise<Account> {
        const updateData: Record<string, unknown> = {
            updatedAt: new Date(),
            updatedBy: data.updatedBy,
        };

        if (data.code !== undefined) updateData.code = data.code;
        if (data.name !== undefined) updateData.name = data.name;
        if (data.parentId !== undefined) updateData.parentId = data.parentId;
        if (data.accountType !== undefined) updateData.accountType = data.accountType;
        if (data.normalBalance !== undefined) updateData.normalBalance = data.normalBalance;
        if (data.currency !== undefined) updateData.currency = data.currency;
        if (data.isActive !== undefined) updateData.isActive = data.isActive;
        if (data.allowPosting !== undefined) updateData.allowPosting = data.allowPosting;

        const [account] = await this.db
            .update(accountsTable)
            .set(updateData)
            .where(and(eq(accountsTable.id, id), eq(accountsTable.tenantId, tenantId)))
            .returning();

        if (!account) {
            throw new Error('Account not found or access denied');
        }

        return this.mapToAccount(account);
    }

    async archive(id: number, tenantId: string, updatedBy: string): Promise<Account> {
        const [account] = await this.db
            .update(accountsTable)
            .set({
                isActive: false,
                effectiveEndDate: new Date(),
                updatedAt: new Date(),
                updatedBy,
            })
            .where(and(eq(accountsTable.id, id), eq(accountsTable.tenantId, tenantId)))
            .returning();

        if (!account) {
            throw new Error('Account not found or access denied');
        }

        return this.mapToAccount(account);
    }

    async reparent(
        accountId: number,
        newParentId: number | null,
        tenantId: string,
        updatedBy: string
    ): Promise<Account> {
        const newLevel = newParentId
            ? (await this.calculateLevel(newParentId, tenantId)) + 1
            : 1;

        const [account] = await this.db
            .update(accountsTable)
            .set({
                parentId: newParentId,
                level: newLevel,
                updatedAt: new Date(),
                updatedBy,
            })
            .where(and(eq(accountsTable.id, accountId), eq(accountsTable.tenantId, tenantId)))
            .returning();

        if (!account) {
            throw new Error('Account not found or access denied');
        }

        return this.mapToAccount(account);
    }

    async hasChildren(accountId: number, tenantId: string): Promise<boolean> {
        const [result] = await this.db
            .select()
            .from(accountsTable)
            .where(and(eq(accountsTable.parentId, accountId), eq(accountsTable.tenantId, tenantId)))
            .limit(1);

        return !!result;
    }

    /**
     * Helper: Calculate hierarchy level from parent
     */
    private async calculateLevel(parentId: number, tenantId: string): Promise<number> {
        const parent = await this.findById(parentId, tenantId);
        return parent ? parent.level + 1 : 1;
    }

    /**
     * Helper: Map DB row to domain Account
     */
    private mapToAccount(row: typeof accountsTable.$inferSelect): Account {
        return {
            id: row.id,
            tenantId: row.tenantId,
            code: row.code,
            name: row.name,
            parentId: row.parentId ?? null,
            accountType: row.accountType,
            normalBalance: row.normalBalance,
            currency: row.currency,
            isActive: row.isActive,
            allowPosting: row.allowPosting,
            level: row.level,
            effectiveStartDate: row.effectiveStartDate,
            effectiveEndDate: row.effectiveEndDate ?? null,
            createdAt: row.createdAt,
            createdBy: row.createdBy,
            updatedAt: row.updatedAt,
            updatedBy: row.updatedBy,
        };
    }
}