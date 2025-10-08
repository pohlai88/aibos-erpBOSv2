'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useUpdateAccount, useAccounts } from '@/lib/hooks/use-accounts';
import { Input, Select, Button, Card, Badge } from 'aibos-ui';
import type { UpdateAccountRequest, AccountResponse } from '@aibos/contracts/core-ledger/schemas';

/**
 * Account Detail/Edit Page
 */
export default function AccountDetailPage({ params }: { params: { id: string } }): React.JSX.Element {
    const id = parseInt(params.id, 10);
    const accountQuery = useAccount(id);
    const account: AccountResponse | undefined = accountQuery.data as AccountResponse | undefined;
    const isLoading: boolean = accountQuery.isLoading;
    const allAccountsQuery = useAccounts();
    const allAccounts: AccountResponse[] | undefined = allAccountsQuery.data as AccountResponse[] | undefined;
    const updateAccountMutation = useUpdateAccount();

    const [formData, setFormData] = useState<UpdateAccountRequest>({});

    useEffect(() => {
        if (account && 'code' in account) {
            setFormData({
                code: account.code,
                name: account.name,
                accountType: account.accountType,
                currency: account.currency,
                allowPosting: account.allowPosting,
                isActive: account.isActive,
            });
        }
    }, [account]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateAccountMutation.mutateAsync({ id, data: formData });
            alert('Account updated successfully');
            window.location.href = '/core-ledger';
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to update account');
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto p-6">
                <div className="text-center py-8">Loading...</div>
            </div>
        );
    }

    if (!account) {
        return (
            <div className="container mx-auto p-6">
                <Card>
                    <div className="text-red-600">Account not found</div>
                </Card>
            </div>
        );
    }

    // Get potential parent accounts (same type, not self, not descendants)
    const parentOptions =
        (allAccounts && account && 'accountType' in account)
            ? allAccounts
                .filter(a => a.accountType === account.accountType && a.id !== account.id && a.isActive)
                .map(a => ({ value: a.id.toString(), label: `${a.code} - ${a.name}` }))
            : [];

    // Mark as used
    void parentOptions;

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Edit Account</h1>
                    {account && 'id' in account && (
                        <p className="text-gray-600 mt-1">ID: {account.id}</p>
                    )}
                </div>
                <Button variant="secondary" onClick={() => (window.location.href = '/core-ledger')}>
                    Back to List
                </Button>
            </div>

            <Card>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Account Code</label>
                            <Input
                                value={formData.code || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, code: e.target.value })}
                                placeholder="e.g., 1000-CASH"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                            <Input
                                value={formData.name || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Cash on Hand"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                            <Select
                                value={formData.accountType || ''}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                    setFormData({
                                        ...formData,
                                        accountType: e.target.value as UpdateAccountRequest['accountType'],
                                    })
                                }
                                options={[
                                    { value: 'ASSET', label: 'Asset' },
                                    { value: 'LIABILITY', label: 'Liability' },
                                    { value: 'EQUITY', label: 'Equity' },
                                    { value: 'REVENUE', label: 'Revenue' },
                                    { value: 'EXPENSE', label: 'Expense' },
                                ]}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                            <Input
                                value={formData.currency || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, currency: e.target.value })}
                                placeholder="USD"
                                maxLength={3}
                            />
                        </div>

                        <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.allowPosting || false}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setFormData({ ...formData, allowPosting: e.target.checked })
                                    }
                                    className="w-4 h-4"
                                />
                                <span className="text-sm text-gray-700">Allow Posting</span>
                            </label>

                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive !== false}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setFormData({ ...formData, isActive: e.target.checked })
                                    }
                                    className="w-4 h-4"
                                />
                                <span className="text-sm text-gray-700">Active</span>
                            </label>
                        </div>
                    </div>

                    {account && 'normalBalance' in account && (
                        <div className="mt-6 p-4 bg-gray-50 rounded">
                            <h3 className="font-semibold text-gray-900 mb-2">Current Status</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-600">Normal Balance:</span>{' '}
                                    <Badge variant={account.normalBalance === 'DEBIT' ? 'success' : 'warning'}>
                                        {account.normalBalance}
                                    </Badge>
                                </div>
                                <div>
                                    <span className="text-gray-600">Level:</span> {account.level}
                                </div>
                                <div>
                                    <span className="text-gray-600">Created:</span>{' '}
                                    {new Date(account.createdAt).toLocaleDateString()} by {account.createdBy}
                                </div>
                                <div>
                                    <span className="text-gray-600">Updated:</span>{' '}
                                    {new Date(account.updatedAt).toLocaleDateString()} by {account.updatedBy}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-6 flex gap-3">
                        <Button type="submit" variant="primary">
                            Save Changes
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => (window.location.href = '/core-ledger')}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
