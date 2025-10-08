import { updateAccountSchema } from '@aibos/contracts/core-ledger/schemas';
import { createAccountsService } from '@/lib/factories/accounts-service-factory';
import { handleApiError, ok, noContent } from '@/lib/api-helpers';
import type { TenantContext } from '@aibos/adapters/db/connection';
import type { UpdateAccountRequest } from '@aibos/contracts/core-ledger/schemas';

/**
 * GET /api/core-ledger/accounts/[id]
 * Get account by ID
 */
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id, 10);

        // TODO: Extract tenant context from auth middleware
        const tenantContext: TenantContext = {
            tenantId: request.headers.get('x-tenant-id') || 'default-tenant',
            userId: request.headers.get('x-user-id') || 'system',
        };

        const service = createAccountsService(tenantContext);
        const result = await service.getAccount(id);

        return ok(result);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * PUT /api/core-ledger/accounts/[id]
 * Update account
 */
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id, 10);
        const body = await request.json();
        const validated = updateAccountSchema.parse(body);

        // TODO: Extract tenant context from auth middleware
        const tenantContext: TenantContext = {
            tenantId: request.headers.get('x-tenant-id') || 'default-tenant',
            userId: request.headers.get('x-user-id') || 'system',
        };

        const service = createAccountsService(tenantContext);
        const result = await service.updateAccount(id, validated as any);

        return ok(result);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * DELETE /api/core-ledger/accounts/[id]
 * Archive account (soft delete)
 */
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id, 10);

        // TODO: Extract tenant context from auth middleware
        const tenantContext: TenantContext = {
            tenantId: request.headers.get('x-tenant-id') || 'default-tenant',
            userId: request.headers.get('x-user-id') || 'system',
        };

        const service = createAccountsService(tenantContext);
        await service.archiveAccount(id);

        return noContent();
    } catch (error) {
        return handleApiError(error);
    }
}
