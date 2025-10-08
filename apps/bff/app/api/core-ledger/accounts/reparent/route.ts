import { reparentRequestSchema } from '@aibos/contracts/core-ledger/schemas';
import { createAccountsService } from '@/lib/factories/accounts-service-factory';
import { handleApiError, ok } from '@/lib/api-helpers';
import type { TenantContext } from '@aibos/adapters/db/connection';

/**
 * POST /api/core-ledger/accounts/reparent
 * Reparent an account (move in hierarchy)
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const body = await request.json();
        const { newParentId } = reparentRequestSchema.parse(body);
        const accountId = parseInt(params.id);

        // TODO: Extract tenant context from auth middleware
        const tenantContext: TenantContext = {
            tenantId: request.headers.get('x-tenant-id') || 'default-tenant',
            userId: request.headers.get('x-user-id') || 'system',
        };

        const service = createAccountsService(tenantContext);
        const result = await service.reparentAccount(accountId, newParentId);

        return ok(result);
    } catch (error) {
        return handleApiError(error);
    }
}
