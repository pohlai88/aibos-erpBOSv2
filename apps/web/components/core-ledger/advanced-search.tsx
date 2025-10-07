'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Button, Input, Select, Card, Checkbox } from 'aibos-ui';
// Removed unused imports: useAccounts, useArchiveAccount
import { useToast } from '@/components/shared/toast-provider';
import type { AccountResponse, SearchFilters } from '@aibos/contracts/core-ledger/schemas';

interface AdvancedSearchProps {
    onSearch: (query: string, filters: SearchFilters) => void;
    onClear: () => void;
    isLoading?: boolean;
}

interface BulkOperationsProps {
    selectedAccounts: number[];
    onSelectionChange: (accountIds: number[]) => void;
    accounts: AccountResponse[];
    onBulkArchive: (accountIds: number[]) => Promise<void>;
    isLoading?: boolean;
}

const ACCOUNT_TYPES = [
    { value: '', label: 'All Types' },
    { value: 'ASSET', label: 'Asset' },
    { value: 'LIABILITY', label: 'Liability' },
    { value: 'EQUITY', label: 'Equity' },
    { value: 'REVENUE', label: 'Revenue' },
    { value: 'EXPENSE', label: 'Expense' },
] as const;

const CURRENCIES = [
    { value: '', label: 'All Currencies' },
    { value: 'USD', label: 'USD' },
    { value: 'EUR', label: 'EUR' },
    { value: 'GBP', label: 'GBP' },
    { value: 'JPY', label: 'JPY' },
    { value: 'CAD', label: 'CAD' },
    { value: 'AUD', label: 'AUD' },
] as const;

const STATUS_OPTIONS = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active Only' },
    { value: 'archived', label: 'Archived Only' },
] as const;

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
    onSearch,
    onClear,
    isLoading = false,
}) => {
    const [query, setQuery] = useState('');
    const [filters, setFilters] = useState<SearchFilters>({
        accountType: undefined,
        currency: undefined,
        isActive: undefined,
    });

    const handleFilterChange = useCallback((key: keyof SearchFilters, value: string | boolean | undefined) => {
        setFilters(prev => ({
            ...prev,
            [key]: value === '' ? undefined : value,
        }));
    }, []);

    const handleSearch = useCallback(() => {
        onSearch(query, filters);
    }, [query, filters, onSearch]);

    const handleClear = useCallback(() => {
        setQuery('');
        setFilters({
            accountType: undefined,
            currency: undefined,
            isActive: undefined,
        });
        onClear();
    }, [onClear]);

    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    }, [handleSearch]);

    return (
        <Card className="p-4">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Advanced Search
                    </h3>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleClear}
                        disabled={isLoading}
                    >
                        Clear All
                    </Button>
                </div>

                {/* Search Query */}
                <div>
                    <label htmlFor="search-query" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Search Query
                    </label>
                    <Input
                        id="search-query"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Search by account code or name..."
                        disabled={isLoading}
                    />
                </div>

                {/* Filters Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <Select
                            label="Account Type"
                            value={filters.accountType || ''}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange('accountType', e.target.value)}
                            options={ACCOUNT_TYPES}
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <Select
                            label="Currency"
                            value={filters.currency || ''}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange('currency', e.target.value)}
                            options={CURRENCIES}
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <Select
                            label="Status"
                            value={
                                filters.isActive === true ? 'active' :
                                    filters.isActive === false ? 'archived' : ''
                            }
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                const value = e.target.value;
                                handleFilterChange('isActive',
                                    value === 'active' ? true :
                                        value === 'archived' ? false : undefined
                                );
                            }}
                            options={STATUS_OPTIONS}
                            disabled={isLoading}
                        />
                    </div>
                </div>

                {/* Search Button */}
                <div className="flex justify-end">
                    <Button
                        variant="primary"
                        onClick={handleSearch}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Searching...' : 'Search Accounts'}
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export const BulkOperations: React.FC<BulkOperationsProps> = ({
    selectedAccounts,
    onSelectionChange,
    accounts,
    onBulkArchive,
    isLoading = false,
}) => {
    const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const { success, error: showError } = useToast();

    const handleSelectAll = useCallback(() => {
        if (selectedAccounts.length === accounts.length) {
            onSelectionChange([]);
        } else {
            onSelectionChange(accounts.map(account => account.id));
        }
    }, [selectedAccounts.length, accounts, onSelectionChange]);

    const handleSelectAccount = useCallback((accountId: number) => {
        if (selectedAccounts.includes(accountId)) {
            onSelectionChange(selectedAccounts.filter(id => id !== accountId));
        } else {
            onSelectionChange([...selectedAccounts, accountId]);
        }
    }, [selectedAccounts, onSelectionChange]);

    const handleBulkArchive = useCallback(async () => {
        if (selectedAccounts.length === 0) return;

        try {
            await onBulkArchive(selectedAccounts);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            success('Bulk Archive Complete', `${selectedAccounts.length} accounts have been archived.`);
            onSelectionChange([]);
            setIsArchiveModalOpen(false);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to archive accounts';
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            showError('Bulk Archive Failed', errorMessage);
        }
    }, [selectedAccounts, onBulkArchive, onSelectionChange, success, showError]);

    const selectedAccountsData = useMemo(() => {
        return accounts.filter(account => selectedAccounts.includes(account.id));
    }, [accounts, selectedAccounts]);

    if (accounts.length === 0) {
        return null;
    }

    return (
        <>
            <Card className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Checkbox
                            checked={selectedAccounts.length === accounts.length && accounts.length > 0}
                            onChange={handleSelectAll}
                            disabled={isLoading}
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedAccounts.length > 0
                                ? `${selectedAccounts.length} of ${accounts.length} selected`
                                : `Select accounts for bulk operations`
                            }
                        </span>
                    </div>

                    {selectedAccounts.length > 0 && (
                        <div className="flex space-x-2">
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setIsArchiveModalOpen(true)}
                                disabled={isLoading}
                            >
                                Archive Selected ({selectedAccounts.length})
                            </Button>
                        </div>
                    )}
                </div>

                {/* Selected Accounts Preview */}
                {selectedAccounts.length > 0 && (
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                            Selected Accounts:
                        </h4>
                        <div className="space-y-1">
                            {selectedAccountsData.map(account => (
                                <div key={account.id} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-700 dark:text-gray-300">
                                        {account.code} - {account.name}
                                    </span>
                                    <button
                                        onClick={() => handleSelectAccount(account.id)}
                                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </Card>

            {/* Archive Confirmation Modal */}
            {isArchiveModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <Card className="p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                            Confirm Bulk Archive
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Are you sure you want to archive {selectedAccounts.length} account{selectedAccounts.length !== 1 ? 's' : ''}?
                            This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <Button
                                variant="secondary"
                                onClick={() => setIsArchiveModalOpen(false)}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleBulkArchive}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Archiving...' : `Archive ${selectedAccounts.length} Account${selectedAccounts.length !== 1 ? 's' : ''}`}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </>
    );
};

export default AdvancedSearch;
