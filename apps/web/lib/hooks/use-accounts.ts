import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
    AccountResponse,
    AccountHierarchyResponse,
    CreateAccountRequest,
    UpdateAccountRequest,
    ReparentValidationResponse,
} from '@aibos/contracts/core-ledger/schemas';

/**
 * React Query hooks for Core Ledger accounts
 */

const API_BASE = '/api/core-ledger/accounts';

// Fetch all accounts
export function useAccounts(searchQuery?: string) {
    return useQuery({
        queryKey: ['accounts', searchQuery],
        queryFn: async () => {
            const url = searchQuery ? `${API_BASE}?q=${encodeURIComponent(searchQuery)}` : API_BASE;
            const response = await fetch(url, {
                headers: {
                    'x-tenant-id': 'default-tenant', // TODO: Get from auth context
                    'x-user-id': 'system', // TODO: Get from auth context
                },
            });
            if (!response.ok) throw new Error('Failed to fetch accounts');
            return response.json() as Promise<AccountResponse[]>;
        },
    });
}

// Fetch single account
export function useAccount(id: number) {
    return useQuery({
        queryKey: ['account', id],
        queryFn: async () => {
            const response = await fetch(`${API_BASE}/${id}`, {
                headers: {
                    'x-tenant-id': 'default-tenant',
                    'x-user-id': 'system',
                },
            });
            if (!response.ok) throw new Error('Failed to fetch account');
            return response.json() as Promise<AccountResponse>;
        },
        enabled: !!id,
    });
}

// Fetch account hierarchy
export function useAccountHierarchy() {
    return useQuery({
        queryKey: ['accounts', 'hierarchy'],
        queryFn: async () => {
            const response = await fetch(`${API_BASE}/hierarchy`, {
                headers: {
                    'x-tenant-id': 'default-tenant',
                    'x-user-id': 'system',
                },
            });
            if (!response.ok) throw new Error('Failed to fetch hierarchy');
            return response.json() as Promise<AccountHierarchyResponse>;
        },
    });
}

// Create account mutation
export function useCreateAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateAccountRequest) => {
            const response = await fetch(API_BASE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-tenant-id': 'default-tenant',
                    'x-user-id': 'system',
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const error = await response.json() as { message?: string };
                throw new Error(error.message || 'Failed to create account');
            }
            return response.json() as Promise<AccountResponse>;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
        },
    });
}

// Update account mutation
export function useUpdateAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: UpdateAccountRequest }) => {
            const response = await fetch(`${API_BASE}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-tenant-id': 'default-tenant',
                    'x-user-id': 'system',
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const error = await response.json() as { message?: string };
                throw new Error(error.message || 'Failed to update account');
            }
            return response.json() as Promise<AccountResponse>;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['account', variables.id] });
        },
    });
}

// Archive account mutation
export function useArchiveAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const response = await fetch(`${API_BASE}/${id}`, {
                method: 'DELETE',
                headers: {
                    'x-tenant-id': 'default-tenant',
                    'x-user-id': 'system',
                },
            });
            if (!response.ok) {
                const error = await response.json() as { message?: string };
                throw new Error(error.message || 'Failed to archive account');
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
        },
    });
}

// Reparent account mutation
export function useReparentAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ accountId, newParentId }: { accountId: number; newParentId: number | null }) => {
            const response = await fetch(`${API_BASE}/reparent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-tenant-id': 'default-tenant',
                    'x-user-id': 'system',
                },
                body: JSON.stringify({ accountId, newParentId }),
            });
            if (!response.ok) {
                const error = await response.json() as { message?: string };
                throw new Error(error.message || 'Failed to reparent account');
            }
            return response.json() as Promise<AccountResponse>;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
        },
    });
}

// Validate reparent
export async function validateReparent(
    accountId: number,
    newParentId: number | null
): Promise<ReparentValidationResponse> {
    const response = await fetch(`${API_BASE}/reparent/validate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': 'default-tenant',
            'x-user-id': 'system',
        },
        body: JSON.stringify({ accountId, newParentId }),
    });
    if (!response.ok) {
        throw new Error('Failed to validate reparent');
    }
    return response.json() as Promise<ReparentValidationResponse>;
}
