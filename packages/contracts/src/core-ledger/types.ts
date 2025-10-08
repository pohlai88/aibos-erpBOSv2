/**
 * Core Ledger Contract Types
 * Re-exports from schemas for consistency
 */

export type {
    CreateAccountRequest,
    UpdateAccountRequest,
    AccountResponse,
    AccountHierarchyNode,
    AccountHierarchyResponse,
    ReparentRequest,
    ReparentValidationResponse,
    SearchFilters,
    SearchQuery,
} from './schemas';

export { accountTypeSchema, normalBalanceSchema } from './schemas';

// Type aliases for clarity
export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
export type NormalBalance = 'DEBIT' | 'CREDIT';
