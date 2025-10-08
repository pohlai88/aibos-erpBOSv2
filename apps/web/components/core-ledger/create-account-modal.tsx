'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button, Input, Select, Modal, Card } from 'aibos-ui';
import { useCreateAccount, useAccounts } from '@/lib/hooks/use-accounts';
import { useToast } from '@/components/shared/toast-provider';
import type { CreateAccountRequest, AccountResponse } from '@aibos/contracts/core-ledger/schemas';

interface CreateAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (account: AccountResponse) => void;
}

interface FormData {
    code: string;
    name: string;
    parentId?: number;
    accountType: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
    currency: string;
    allowPosting: boolean;
}

interface FormErrors {
    code?: string;
    name?: string;
    parentId?: string;
    accountType?: string;
    currency?: string;
    allowPosting?: string;
    general?: string;
}

const ACCOUNT_TYPES = [
    { value: 'ASSET', label: 'Asset', description: 'Resources owned by the company' },
    { value: 'LIABILITY', label: 'Liability', description: 'Debts and obligations' },
    { value: 'EQUITY', label: 'Equity', description: 'Owner\'s stake in the company' },
    { value: 'REVENUE', label: 'Revenue', description: 'Income from business operations' },
    { value: 'EXPENSE', label: 'Expense', description: 'Costs incurred in operations' },
] as const;

const CURRENCIES = [
    { value: 'USD', label: 'US Dollar (USD)' },
    { value: 'EUR', label: 'Euro (EUR)' },
    { value: 'GBP', label: 'British Pound (GBP)' },
    { value: 'JPY', label: 'Japanese Yen (JPY)' },
    { value: 'CAD', label: 'Canadian Dollar (CAD)' },
    { value: 'AUD', label: 'Australian Dollar (AUD)' },
] as const;

export const CreateAccountModal: React.FC<CreateAccountModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
}) => {
    const [formData, setFormData] = useState<FormData>({
        code: '',
        name: '',
        accountType: 'ASSET',
        currency: 'USD',
        allowPosting: true,
    });

    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const createAccountMutation = useCreateAccount();
    const accountsQuery = useAccounts();
    const allAccounts = accountsQuery.data || [];
    const { success, error: showError } = useToast();

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setFormData({
                code: '',
                name: '',
                accountType: 'ASSET',
                currency: 'USD',
                allowPosting: true,
            });
            setErrors({});
        }
    }, [isOpen]);

    const validateForm = useCallback((): boolean => {
        const newErrors: FormErrors = {};

        // Code validation
        if (!formData.code.trim()) {
            newErrors.code = 'Account code is required';
        } else if (formData.code.length < 3) {
            newErrors.code = 'Account code must be at least 3 characters';
        } else if (!/^[A-Z0-9-]+$/.test(formData.code)) {
            newErrors.code = 'Account code must contain only uppercase letters, numbers, and hyphens';
        } else if (allAccounts.some(acc => acc.code === formData.code)) {
            newErrors.code = 'Account code already exists';
        }

        // Name validation
        if (!formData.name.trim()) {
            newErrors.name = 'Account name is required';
        } else if (formData.name.length < 5) {
            newErrors.name = 'Account name must be at least 5 characters';
        }

        // Currency validation
        if (!formData.currency) {
            newErrors.currency = 'Currency is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData, allAccounts]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setErrors({});

        try {
            const requestData: CreateAccountRequest = {
                code: formData.code.trim().toUpperCase(),
                name: formData.name.trim(),
                accountType: formData.accountType,
                currency: formData.currency,
                allowPosting: formData.allowPosting,
                ...(formData.parentId && { parentId: formData.parentId }),
            };

            const newAccount = await createAccountMutation.mutateAsync(requestData);

            // Success callback
            onSuccess?.(newAccount);

            // Close modal
            onClose();

            // Show success toast
            success('Account Created', `Account "${newAccount.name}" has been created successfully.`);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create account';
            setErrors({ general: errorMessage });
            showError('Creation Failed', errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, validateForm, createAccountMutation, onSuccess, onClose]);

    const handleInputChange = useCallback((field: keyof FormData, value: string | number | boolean | undefined) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Clear field-specific error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    }, [errors]);

    const handleCodeChange = useCallback((value: string) => {
        // Auto-format code to uppercase
        const formattedValue = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
        handleInputChange('code', formattedValue);
    }, [handleInputChange]);

    // Filter parent accounts based on account type
    const availableParentAccounts = allAccounts.filter(account =>
        account.isActive &&
        account.accountType === formData.accountType &&
        account.level < 5 // Max hierarchy depth
    );

    const selectedAccountType = ACCOUNT_TYPES.find(type => type.value === formData.accountType);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Create New Account"
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* General Error */}
                {errors.general && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-red-800 dark:text-red-200 text-sm">{errors.general}</p>
                    </div>
                )}

                {/* Account Type Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Account Type *
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                        {ACCOUNT_TYPES.map((type) => (
                            <label
                                key={type.value}
                                className={`
                  flex items-start p-3 border rounded-lg cursor-pointer transition-colors
                  ${formData.accountType === type.value
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                    }
                `}
                            >
                                <input
                                    type="radio"
                                    name="accountType"
                                    value={type.value}
                                    checked={formData.accountType === type.value}
                                    onChange={(e) => handleInputChange('accountType', e.target.value)}
                                    className="mt-1 mr-3"
                                />
                                <div>
                                    <div className="font-medium text-gray-900 dark:text-gray-100">
                                        {type.label}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {type.description}
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>
                    {errors.accountType && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.accountType}</p>
                    )}
                </div>

                {/* Account Code */}
                <div>
                    <label htmlFor="account-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Account Code *
                    </label>
                    <Input
                        id="account-code"
                        value={formData.code}
                        onChange={(e) => handleCodeChange(e.target.value)}
                        placeholder="e.g., 1000, CASH-001"
                        maxLength={50}
                        className="font-mono"
                    />
                    {errors.code && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.code}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Use uppercase letters, numbers, and hyphens only. Must be unique.
                    </p>
                </div>

                {/* Account Name */}
                <div>
                    <label htmlFor="account-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Account Name *
                    </label>
                    <Input
                        id="account-name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="e.g., Cash and Cash Equivalents"
                        maxLength={255}
                    />
                    {errors.name && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                    )}
                </div>

                {/* Parent Account */}
                {availableParentAccounts.length > 0 && (
                    <div>
                        <label htmlFor="parent-account" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Parent Account
                        </label>
                        <Select
                            id="parent-account"
                            value={formData.parentId || ''}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('parentId', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                            options={[
                                { value: '', label: 'No parent (Root account)' },
                                ...availableParentAccounts.map(account => ({
                                    value: account.id.toString(),
                                    label: `${account.code} - ${account.name}`,
                                })),
                            ]}
                        />
                        {errors.parentId && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.parentId}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Optional. Child accounts inherit the parent's account type.
                        </p>
                    </div>
                )}

                {/* Currency */}
                <div>
                    <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Currency *
                    </label>
                    <Select
                        id="currency"
                        value={formData.currency}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('currency', e.target.value)}
                        options={CURRENCIES}
                    />
                    {errors.currency && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.currency}</p>
                    )}
                </div>

                {/* Allow Posting */}
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="allowPosting"
                        checked={formData.allowPosting}
                        onChange={(e) => handleInputChange('allowPosting', e.target.checked)}
                        className="mr-2"
                    />
                    <label htmlFor="allowPosting" className="text-sm text-gray-700 dark:text-gray-300">
                        Allow posting transactions to this account
                    </label>
                </div>

                {/* Account Type Info */}
                {selectedAccountType && (
                    <Card className="bg-gray-50 dark:bg-gray-800">
                        <div className="text-sm">
                            <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                                {selectedAccountType.label} Account
                            </div>
                            <div className="text-gray-600 dark:text-gray-400">
                                Normal Balance: {formData.accountType === 'ASSET' || formData.accountType === 'EXPENSE' ? 'DEBIT' : 'CREDIT'}
                            </div>
                        </div>
                    </Card>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Creating...' : 'Create Account'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default CreateAccountModal;
