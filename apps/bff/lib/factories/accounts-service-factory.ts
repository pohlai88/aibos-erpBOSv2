import { AccountsServiceImpl } from '@aibos/services/core-ledger/accounts-service';
import { AccountsAdapter } from '@aibos/adapters/core-ledger/accounts-adapter';
import { AccountsPolicies } from '@aibos/policies/core-ledger/accounts-policies';
import { ConsoleLogger } from '@aibos/adapters/shared/console-logger';
import { db, type TenantContext } from '@aibos/adapters/db/connection';

/**
 * Accounts Service Factory - Centralized DI for Core Ledger
 * Singleton pattern for performance
 */

let serviceCache: WeakMap<TenantContext, AccountsServiceImpl> = new WeakMap();

export function createAccountsService(tenantContext: TenantContext): AccountsServiceImpl {
    // Check cache first
    const cached = serviceCache.get(tenantContext);
    if (cached) {
        return cached;
    }

    // Create dependencies
    const adapter = new AccountsAdapter(db);
    const policies = new AccountsPolicies();
    const logger = new ConsoleLogger();

    // Create service
    const service = new AccountsServiceImpl(adapter, policies, logger, tenantContext);

    // Cache for this tenant context
    serviceCache.set(tenantContext, service);

    return service;
}

/**
 * For testing - allows injection of mocks
 */
export function createAccountsServiceWithDependencies(
    adapter: AccountsAdapter,
    policies: AccountsPolicies,
    logger: ConsoleLogger,
    tenantContext: TenantContext
): AccountsServiceImpl {
    return new AccountsServiceImpl(adapter, policies, logger, tenantContext);
}

/**
 * Reset cache (for testing)
 */
export function resetAccountsServiceCache(): void {
    serviceCache = new WeakMap();
}
