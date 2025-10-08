import { createAccountsService } from '@/lib/factories/accounts-service-factory';
import { handleApiError, ok } from '@/lib/api-helpers';
import type { TenantContext } from '@aibos/adapters/db/connection';

/**
 * GET /api/core-ledger/accounts/hierarchy
 * Get account hierarchy (tree structure)
 */
export async function GET(request: Request) {
    try {
        // TODO: Extract tenant context from auth middleware
        const tenantContext: TenantContext = {
            tenantId: request.headers.get('x-tenant-id') || 'default-tenant',
            userId: request.headers.get('x-user-id') || 'system',
        };

        const service = createAccountsService(tenantContext);
        const result = await service.getAccountHierarchy();

        return ok(result);
    } catch (error) {
        return handleApiError(error);
    }
}
