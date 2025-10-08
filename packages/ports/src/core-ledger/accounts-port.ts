/**
 * Core Ledger Ports - Domain interfaces and types
 * No implementation, pure abstractions for dependency inversion
 */

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
export type NormalBalance = 'DEBIT' | 'CREDIT';

export interface Account {
    id: number;
    tenantId: string;
    code: string;
    name: string;
    parentId: number | null;
    accountType: AccountType;
    normalBalance: NormalBalance;
    currency: string;
    isActive: boolean;
    allowPosting: boolean;
    level: number;
    effectiveStartDate: Date;
    effectiveEndDate: Date | null;
    createdAt: Date;
    createdBy: string;
    updatedAt: Date;
    updatedBy: string;
}

export interface CreateAccountData {
    tenantId: string;
    code: string;
    name: string;
    parentId?: number;
    accountType: AccountType;
    normalBalance: NormalBalance; // Will be derived by service
    currency?: string;
    allowPosting?: boolean;
    createdBy: string;
    updatedBy: string;
}

export interface UpdateAccountData {
    code?: string;
    name?: string;
    parentId?: number;
    accountType?: AccountType;
    normalBalance?: NormalBalance;
    currency?: string;
    isActive?: boolean;
    allowPosting?: boolean;
    updatedBy: string;
}

export interface SearchFilters {
    accountType?: AccountType | undefined;
    currency?: string | undefined;
    isActive?: boolean | undefined;
    allowPosting?: boolean | undefined;
}

/**
 * Repository interface - data access abstraction
 */
export interface AccountsRepository {
    create(data: CreateAccountData): Promise<Account>;
    findById(id: number, tenantId: string): Promise<Account | null>;
    findByCode(code: string, tenantId: string): Promise<Account | null>;
    findChildren(parentId: number, tenantId: string): Promise<Account[]>;
    findHierarchy(tenantId: string): Promise<Account[]>;
    search(query: string, tenantId: string, filters?: SearchFilters): Promise<Account[]>;
    update(id: number, tenantId: string, data: UpdateAccountData): Promise<Account>;
    archive(id: number, tenantId: string, updatedBy: string): Promise<Account>;
    reparent(accountId: number, newParentId: number | null, tenantId: string, updatedBy: string): Promise<Account>;
    hasChildren(accountId: number, tenantId: string): Promise<boolean>;
}

/**
 * Service interface - business logic abstraction
 */
export interface CreateAccountRequest {
    code: string;
    name: string;
    parentId?: number;
    accountType: AccountType;
    currency?: string;
    allowPosting?: boolean;
}

export interface UpdateAccountRequest {
    code?: string;
    name?: string;
    parentId?: number;
    accountType?: AccountType;
    currency?: string;
    isActive?: boolean;
    allowPosting?: boolean;
}

export interface AccountResponse {
    id: number;
    code: string;
    name: string;
    parentId: number | null;
    accountType: AccountType;
    normalBalance: NormalBalance;
    currency: string;
    isActive: boolean;
    allowPosting: boolean;
    level: number;
    effectiveStartDate: string;
    effectiveEndDate: string | null;
    createdAt: string;
    createdBy: string;
    updatedAt: string;
    updatedBy: string;
}

export interface AccountHierarchyNode extends AccountResponse {
    children: AccountHierarchyNode[];
}

export interface AccountHierarchyResponse {
    accounts: AccountResponse[];
    hierarchy: AccountHierarchyNode[];
}

export interface ReparentValidationResponse {
    valid: boolean;
    message: string;
}

export interface AccountsService {
    createAccount(request: CreateAccountRequest): Promise<AccountResponse>;
    getAccount(id: number): Promise<AccountResponse>;
    getAccountByCode(code: string): Promise<AccountResponse>;
    getAccountChildren(parentId: number): Promise<AccountResponse[]>;
    getAccountHierarchy(): Promise<AccountHierarchyResponse>;
    searchAccounts(query: string, filters?: SearchFilters): Promise<AccountResponse[]>;
    updateAccount(id: number, request: UpdateAccountRequest): Promise<AccountResponse>;
    archiveAccount(id: number): Promise<void>;
    reparentAccount(accountId: number, newParentId: number | null): Promise<AccountResponse>;
    validateReparent(accountId: number, newParentId: number | null): Promise<ReparentValidationResponse>;
}
