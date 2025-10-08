import type {
    AccountsRepository,
    AccountsService,
    CreateAccountRequest,
    UpdateAccountRequest,
    AccountResponse,
    AccountHierarchyResponse,
    AccountHierarchyNode,
    ReparentValidationResponse,
    SearchFilters,
    Account,
    AccountType,
    NormalBalance,
    UpdateAccountData,
} from '@aibos/ports/core-ledger/accounts-port';
import type { AccountsPolicies } from '@aibos/policies/core-ledger/accounts-policies';
import type { Logger } from '@aibos/ports/shared/logger-port';
import { NotFoundError, BusinessError } from '@aibos/contracts/shared/errors';
import type { TenantContext } from '@aibos/adapters/db/connection';

/**
 * Accounts Service - Business logic and orchestration
 * Enforces invariants and delegates to policies/repository
 */
export class AccountsServiceImpl implements AccountsService {
    constructor(
        private repository: AccountsRepository,
        private policies: AccountsPolicies,
        private logger: Logger,
        private tenantContext: TenantContext
    ) { }

    async createAccount(request: CreateAccountRequest): Promise<AccountResponse> {
        this.logger.info('Creating account', { code: request.code, tenant: this.tenantContext.tenantId });

        // Step 1: Validate input using policies
        await this.policies.validateCreate(request);

        // Step 2: Check for duplicate code (tenant-scoped)
        const existingAccount = await this.repository.findByCode(request.code, this.tenantContext.tenantId);
        if (existingAccount) {
            throw new BusinessError('Account code already exists in this tenant', 'DUPLICATE_CODE');
        }

        // Step 3: Validate parent account if provided
        if (request.parentId) {
            const parentAccount = await this.repository.findById(request.parentId, this.tenantContext.tenantId);
            if (!parentAccount) {
                throw new NotFoundError('Parent account not found', 'Account');
            }
            await this.policies.validateParentChild(parentAccount, request);
        }

        // Step 4: Derive normal balance (INVARIANT)
        const normalBalance = this.deriveNormalBalance(request.accountType);

        // Step 5: Create account
        const account = await this.repository.create({
            tenantId: this.tenantContext.tenantId,
            ...request,
            normalBalance,
            createdBy: this.tenantContext.userId,
            updatedBy: this.tenantContext.userId,
        });

        this.logger.info('Account created successfully', { id: account.id, code: account.code });

        return this.mapToResponse(account);
    }

    async getAccount(id: number): Promise<AccountResponse> {
        const account = await this.repository.findById(id, this.tenantContext.tenantId);
        if (!account) {
            throw new NotFoundError('Account not found', 'Account');
        }

        return this.mapToResponse(account);
    }

    async getAccountByCode(code: string): Promise<AccountResponse> {
        const account = await this.repository.findByCode(code, this.tenantContext.tenantId);
        if (!account) {
            throw new NotFoundError('Account not found', 'Account');
        }

        return this.mapToResponse(account);
    }

    async getAccountChildren(parentId: number): Promise<AccountResponse[]> {
        const children = await this.repository.findChildren(parentId, this.tenantContext.tenantId);
        return children.map(child => this.mapToResponse(child));
    }

    async getAccountHierarchy(): Promise<AccountHierarchyResponse> {
        const accounts = await this.repository.findHierarchy(this.tenantContext.tenantId);
        const hierarchy = this.buildHierarchyTree(accounts);

        return {
            accounts: accounts.map(account => this.mapToResponse(account)),
            hierarchy,
        };
    }

    async searchAccounts(
        query: string,
        filters?: SearchFilters
    ): Promise<AccountResponse[]> {
        const accounts = await this.repository.search(query, this.tenantContext.tenantId, filters);
        return accounts.map(account => this.mapToResponse(account));
    }

    async updateAccount(
        id: number,
        request: UpdateAccountRequest
    ): Promise<AccountResponse> {
        this.logger.info('Updating account', { id, tenant: this.tenantContext.tenantId });

        // Step 1: Validate input
        await this.policies.validateUpdate(request);

        // Step 2: Check if account exists
        const existingAccount = await this.repository.findById(id, this.tenantContext.tenantId);
        if (!existingAccount) {
            throw new NotFoundError('Account not found', 'Account');
        }

        // Step 3: Auto-adjust normalBalance if accountType changes (INVARIANT)
        let patch: UpdateAccountData = {
            ...request,
            updatedBy: this.tenantContext.userId,
        };

        if (request.accountType && patch.normalBalance === undefined) {
            patch.normalBalance = this.deriveNormalBalance(request.accountType);
        }

        // Step 4: Update account
        const updatedAccount = await this.repository.update(id, this.tenantContext.tenantId, patch);

        this.logger.info('Account updated successfully', { id });

        return this.mapToResponse(updatedAccount);
    }

    async archiveAccount(id: number): Promise<void> {
        this.logger.info('Archiving account', { id, tenant: this.tenantContext.tenantId });

        // Step 1: Check if account exists
        const account = await this.repository.findById(id, this.tenantContext.tenantId);
        if (!account) {
            throw new NotFoundError('Account not found', 'Account');
        }

        // Step 2: Check if has children
        const hasChildren = await this.repository.hasChildren(id, this.tenantContext.tenantId);

        // Step 3: Validate archive guard rails
        await this.policies.validateArchive(account, hasChildren);

        // Step 4: Archive account
        await this.repository.archive(id, this.tenantContext.tenantId, this.tenantContext.userId);

        this.logger.info('Account archived successfully', { id });
    }

    async reparentAccount(
        accountId: number,
        newParentId: number | null
    ): Promise<AccountResponse> {
        this.logger.info('Reparenting account', { accountId, newParentId, tenant: this.tenantContext.tenantId });

        // Step 1: Validate reparent operation
        const validation = await this.validateReparent(accountId, newParentId);
        if (!validation.valid) {
            throw new BusinessError(validation.message, 'INVALID_REPARENT');
        }

        // Step 2: Perform reparent
        const account = await this.repository.reparent(
            accountId,
            newParentId,
            this.tenantContext.tenantId,
            this.tenantContext.userId
        );

        this.logger.info('Account reparented successfully', { accountId, newParentId });

        return this.mapToResponse(account);
    }

    async validateReparent(
        accountId: number,
        newParentId: number | null
    ): Promise<ReparentValidationResponse> {
        const account = await this.repository.findById(accountId, this.tenantContext.tenantId);
        if (!account) {
            return { valid: false, message: 'Account not found' };
        }

        let newParent: Account | null = null;
        if (newParentId) {
            newParent = await this.repository.findById(newParentId, this.tenantContext.tenantId);
            if (!newParent) {
                return { valid: false, message: 'New parent account not found' };
            }
        }

        // Check for circular reference
        const wouldCreateCycle = newParentId
            ? await this.wouldCreateCircularReference(accountId, newParentId)
            : false;

        try {
            await this.policies.validateReparent(account, newParent, wouldCreateCycle);
            return { valid: true, message: 'Reparent operation is valid' };
        } catch (error) {
            return {
                valid: false,
                message: error instanceof Error ? error.message : 'Validation failed',
            };
        }
    }

    /**
     * Derive normal balance from account type (INVARIANT)
     * ASSET | EXPENSE => DEBIT
     * LIABILITY | EQUITY | REVENUE => CREDIT
     */
    private deriveNormalBalance(accountType: AccountType): NormalBalance {
        if (accountType === 'ASSET' || accountType === 'EXPENSE') {
            return 'DEBIT';
        }
        return 'CREDIT'; // LIABILITY, EQUITY, REVENUE
    }

    /**
     * Check if reparenting would create a circular reference
     */
    private async wouldCreateCircularReference(
        accountId: number,
        newParentId: number
    ): Promise<boolean> {
        let currentId: number | null = newParentId;
        const visited = new Set<number>();

        while (currentId) {
            if (visited.has(currentId)) {
                return true; // Circular reference detected
            }

            if (currentId === accountId) {
                return true; // Would create circular reference
            }

            visited.add(currentId);
            const parent = await this.repository.findById(currentId, this.tenantContext.tenantId);
            currentId = parent?.parentId || null;
        }

        return false;
    }

    /**
     * Build hierarchical tree structure from flat list
     */
    private buildHierarchyTree(accounts: Account[]): AccountHierarchyNode[] {
        const accountMap = new Map<number, AccountHierarchyNode>();
        const rootNodes: AccountHierarchyNode[] = [];

        // Create nodes
        accounts.forEach(account => {
            accountMap.set(account.id, {
                ...this.mapToResponse(account),
                children: [],
            });
        });

        // Build tree structure
        accounts.forEach(account => {
            const node = accountMap.get(account.id)!;

            if (account.parentId) {
                const parent = accountMap.get(account.parentId);
                if (parent) {
                    parent.children.push(node);
                }
            } else {
                rootNodes.push(node);
            }
        });

        return rootNodes;
    }

    /**
     * Map domain Account to API response
     */
    private mapToResponse(account: Account): AccountResponse {
        return {
            id: account.id,
            code: account.code,
            name: account.name,
            parentId: account.parentId,
            accountType: account.accountType,
            normalBalance: account.normalBalance,
            currency: account.currency,
            isActive: account.isActive,
            allowPosting: account.allowPosting,
            level: account.level,
            effectiveStartDate: account.effectiveStartDate.toISOString(),
            effectiveEndDate: account.effectiveEndDate ? account.effectiveEndDate.toISOString() : null,
            createdAt: account.createdAt.toISOString(),
            createdBy: account.createdBy,
            updatedAt: account.updatedAt.toISOString(),
            updatedBy: account.updatedBy,
        };
    }
}