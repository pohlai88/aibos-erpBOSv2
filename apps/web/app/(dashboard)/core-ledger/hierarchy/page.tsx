'use client';

import React from 'react';
import { Button, Card } from 'aibos-ui';
import { AccountTree } from '@/components/core-ledger/account-tree';
import { useToast } from '@/components/shared/toast-provider';
import { useAccountHierarchy, useReparentAccount } from '@/lib/hooks/use-accounts';
import type { AccountHierarchyNode, AccountHierarchyResponse } from '@aibos/contracts/core-ledger/schemas';

/**
 * Account Hierarchy Page
 * Tree view with drag-drop reparenting
 */
export default function AccountHierarchyPage(): React.JSX.Element {
    const hierarchyQuery = useAccountHierarchy();
    const hierarchy: AccountHierarchyResponse | undefined = hierarchyQuery.data as AccountHierarchyResponse | undefined;
    const isLoading: boolean = hierarchyQuery.isLoading;
    const error: Error | null = hierarchyQuery.error;
    const reparentAccountMutation = useReparentAccount();
    const { success, error: showError } = useToast();

    const handleReparent = async (accountId: number, newParentId: number | null) => {
        try {
            await reparentAccountMutation.mutateAsync({ accountId, newParentId });
            success('Account Reparented', 'The account has been successfully moved to its new parent.');
        } catch (error) {
            showError('Reparent Failed', error instanceof Error ? error.message : 'Failed to reparent account');
        }
    };

    const handleAccountSelect = (account: AccountHierarchyNode) => {
        // Navigate to account detail page
        window.location.href = `/core-ledger/${account.id}`;
    };

    if (error) {
        return (
            <div className="container mx-auto p-6">
                <Card>
                    <div className="text-red-600">Error loading hierarchy: {(error as Error).message}</div>
                </Card>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="container mx-auto p-6">
                <div className="text-center py-8 text-gray-500">Loading hierarchy...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Account Hierarchy</h1>
                    <p className="text-gray-600 mt-1">Tree view of your chart of accounts</p>
                </div>
                <Button variant="secondary" onClick={() => (window.location.href = '/core-ledger')}>
                    Back to List
                </Button>
            </div>

            <AccountTree
                data={hierarchy?.hierarchy || []}
                onReparent={handleReparent}
                onAccountSelect={handleAccountSelect}
                isLoading={isLoading}
            />
        </div>
    );
}
