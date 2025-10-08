'use client';

import React, { useState, useEffect } from 'react';

// Force dynamic rendering to prevent prerendering errors
export const dynamic = 'force-dynamic';
import { useAccounts, useArchiveAccount } from '@/lib/hooks/use-accounts';
import { Table, Button, Badge, Card } from 'aibos-ui';
import { CreateAccountModal } from '@/components/core-ledger/create-account-modal';
import { useToast } from '@/components/shared/toast-provider';
import type { AccountResponse, SearchFilters } from '@aibos/contracts/core-ledger/schemas';

// Simple debounce hook
const useDebounce = (value: string, delay: number): string => {
    const [debouncedValue, setDebouncedValue] = useState<string>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

/**
 * Core Ledger - Chart of Accounts Page
 * Main listing and management interface
 */
export default function CoreLedgerPage(): React.JSX.Element {
    const [searchQuery, setSearchQuery] = useState('');
    const [_searchFilters, setSearchFilters] = useState<SearchFilters>({});
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);

    // Debounced search for better performance
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const accountsQuery = useAccounts(debouncedSearchQuery);
    const accounts: AccountResponse[] | undefined = accountsQuery.data;
    const isLoading: boolean = accountsQuery.isLoading;
    const error: Error | null = accountsQuery.error;
    const archiveAccountMutation = useArchiveAccount();
    const { success, error: showError } = useToast();

    // Simple filtered data for now
    const filteredAccounts = accounts || [];

    const handleArchive = async (id: number) => {
        try {
            await archiveAccountMutation.mutateAsync(id);
            success('Account Archived', 'Account has been archived successfully.');
        } catch (error) {
            showError('Archive Failed', error instanceof Error ? error.message : 'Failed to archive account');
        }
    };

    const handleBulkArchive = async () => {
        if (selectedAccounts.length === 0) return;

        try {
            // Archive each selected account
            for (const accountId of selectedAccounts) {
                await archiveAccountMutation.mutateAsync(accountId);
            }
            success('Bulk Archive', `${selectedAccounts.length} accounts have been archived successfully.`);
            setSelectedAccounts([]);
        } catch (error) {
            showError('Bulk Archive Failed', error instanceof Error ? error.message : 'Failed to archive accounts');
        }
    };

    const handleCreateSuccess = (newAccount: AccountResponse) => {
        success('Account Created', `Account "${newAccount.name}" has been created successfully.`);
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        setSearchFilters({});
        setSelectedAccounts([]);
    };

    // Filter active accounts
    const activeAccounts = filteredAccounts.filter(account => account.isActive);

    // Table columns
    const columns = [
        {
            key: 'code',
            title: 'Code',
            render: (account: AccountResponse) => (
                <span className="font-mono text-sm font-medium text-gray-900">
                    {account.code}
                </span>
            ),
        },
        {
            key: 'name',
            title: 'Name',
            render: (account: AccountResponse) => (
                <div>
                    <div className="font-medium text-gray-900">{account.name}</div>
                    <div className="text-sm text-gray-500">Level {account.level}</div>
                </div>
            ),
        },
        {
            key: 'type',
            title: 'Type',
            render: (account: AccountResponse) => (
                <Badge variant="secondary">{account.accountType}</Badge>
            ),
        },
        {
            key: 'balance',
            title: 'Normal Balance',
            render: (account: AccountResponse) => (
                <Badge variant={account.normalBalance === 'DEBIT' ? 'default' : 'outline'}>
                    {account.normalBalance}
                </Badge>
            ),
        },
        {
            key: 'currency',
            title: 'Currency',
            render: (account: AccountResponse) => (
                <span className="text-sm text-gray-600">{account.currency}</span>
            ),
        },
        {
            key: 'posting',
            title: 'Posting',
            render: (account: AccountResponse) => (
                <Badge variant={account.allowPosting ? 'default' : 'secondary'}>
                    {account.allowPosting ? 'Allowed' : 'Not Allowed'}
                </Badge>
            ),
        },
        {
            key: 'actions',
            title: 'Actions',
            render: (account: AccountResponse) => (
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = `/core-ledger/${account.id}`}
                    >
                        View
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleArchive(account.id)}
                        disabled={archiveAccountMutation.isPending}
                    >
                        Archive
                    </Button>
                </div>
            ),
        },
    ];

    if (error) {
        return (
            <div className="p-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-2">Error Loading Accounts</h2>
                    <p className="text-gray-600 mb-4">{error.message}</p>
                    <Button onClick={() => window.location.reload()}>
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    // Show loading state during prerendering
    if (typeof window === 'undefined' || isLoading) {
        return (
            <div className="p-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-600 mb-2">Loading Accounts...</h2>
                    <p className="text-gray-500">Please wait while we load your account data.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Chart of Accounts</h1>
                    <p className="text-gray-600 mt-1">Manage your financial account structure</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        onClick={() => (window.location.href = '/core-ledger/hierarchy')}
                    >
                        View Hierarchy
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => setIsCreateModalOpen(true)}
                    >
                        Create Account
                    </Button>
                </div>
            </div>

            <Card>
                <div className="p-6">
                    {/* Search */}
                    <div className="mb-6">
                        <div className="flex gap-4 items-center">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Search accounts..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            {searchQuery && (
                                <Button variant="outline" onClick={handleClearSearch}>
                                    Clear
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Bulk Actions */}
                    {selectedAccounts.length > 0 && (
                        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-blue-700">
                                    {selectedAccounts.length} account(s) selected
                                </span>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedAccounts([])}
                                    >
                                        Clear Selection
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={handleBulkArchive}
                                        disabled={archiveAccountMutation.isPending}
                                    >
                                        Archive Selected
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Accounts Table */}
                    <Table
                        data={activeAccounts}
                        columns={columns}
                        isLoading={isLoading}
                        onRowSelect={(account: AccountResponse) => {
                            const isSelected = selectedAccounts.includes(account.id);
                            if (isSelected) {
                                setSelectedAccounts(selectedAccounts.filter(id => id !== account.id));
                            } else {
                                setSelectedAccounts([...selectedAccounts, account.id]);
                            }
                        }}
                        selectedRows={selectedAccounts}
                    />
                </div>
            </Card>

            {/* Create Account Modal */}
            <CreateAccountModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={handleCreateSuccess}
            />
        </div>
    );
}