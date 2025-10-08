import { createAccountSchema, searchQuerySchema } from '@aibos/contracts/core-ledger/schemas';
import { createAccountsService } from '@/lib/factories/accounts-service-factory';
import { handleApiError, created, ok } from '@/lib/api-helpers';
import type { TenantContext } from '@aibos/adapters/db/connection';

/**
 * GET /api/core-ledger/accounts
 * Search or list all accounts
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchQuerySchema.parse(Object.fromEntries(searchParams));

        // TODO: Extract tenant context from auth middleware
        const tenantContext: TenantContext = {
            tenantId: searchParams.get('tenantId') || 'default-tenant',
            userId: searchParams.get('userId') || 'system',
        };

        const service = createAccountsService(tenantContext);

        const filters = {
            accountType: query.accountType || undefined,
            currency: query.currency || undefined,
            isActive: query.isActive !== undefined ? query.isActive : undefined,
            allowPosting: query.allowPosting !== undefined ? query.allowPosting : undefined,
        };

        let result;
        if (query.q) {
            result = await service.searchAccounts(query.q, filters);
        } else {
            result = await service.getAccountHierarchy();
        }

        return ok(result);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * POST /api/core-ledger/accounts
 * Create a new account
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const accountData = createAccountSchema.parse(body);

        // TODO: Extract tenant context from auth middleware
        const tenantContext: TenantContext = {
            tenantId: 'default-tenant',
            userId: 'system',
        };

        const service = createAccountsService(tenantContext);
        const createData = {
            code: accountData.code,
            name: accountData.name,
            accountType: accountData.accountType,
            currency: accountData.currency,
            allowPosting: accountData.allowPosting,
            ...(accountData.parentId && { parentId: accountData.parentId }),
        };
        const account = await service.createAccount(createData);

        return created(account);
    } catch (error) {
        return handleApiError(error);
    }
}