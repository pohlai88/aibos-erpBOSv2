import { describe, it, expect, beforeEach } from 'vitest';
import { AccountsPolicies } from '../accounts-policies';
import { ValidationError } from '@aibos/contracts/shared/errors';
import type { Account, CreateAccountRequest, AccountType } from '@aibos/ports/core-ledger/accounts-port';

describe('AccountsPolicies', () => {
    let policies: AccountsPolicies;

    beforeEach(() => {
        policies = new AccountsPolicies();
    });

    describe('validateCreate', () => {
        it('should pass validation for valid account data', async () => {
            const validData: CreateAccountRequest = {
                code: 'ACC-001',
                name: 'Test Account',
                accountType: 'ASSET',
                currency: 'USD',
            };

            await expect(policies.validateCreate(validData)).resolves.not.toThrow();
        });

        it('should reject code shorter than 3 characters', async () => {
            const invalidData: CreateAccountRequest = {
                code: 'AB',
                name: 'Test Account',
                accountType: 'ASSET',
            };

            await expect(policies.validateCreate(invalidData)).rejects.toThrow(ValidationError);
            await expect(policies.validateCreate(invalidData)).rejects.toThrow('at least 3 characters');
        });

        it('should reject code with invalid characters', async () => {
            const invalidData: CreateAccountRequest = {
                code: 'test@123',
                name: 'Test Account',
                accountType: 'ASSET',
            };

            await expect(policies.validateCreate(invalidData)).rejects.toThrow(ValidationError);
            await expect(policies.validateCreate(invalidData)).rejects.toThrow('uppercase letters, numbers, and hyphens');
        });

        it('should reject name shorter than 5 characters', async () => {
            const invalidData: CreateAccountRequest = {
                code: 'ACC-001',
                name: 'Test',
                accountType: 'ASSET',
            };

            await expect(policies.validateCreate(invalidData)).rejects.toThrow(ValidationError);
            await expect(policies.validateCreate(invalidData)).rejects.toThrow('at least 5 characters');
        });

        it('should reject invalid account type', async () => {
            const invalidData = {
                code: 'ACC-001',
                name: 'Test Account',
                accountType: 'INVALID_TYPE' as AccountType,
            } as CreateAccountRequest;

            await expect(policies.validateCreate(invalidData)).rejects.toThrow(ValidationError);
        });

        it('should reject invalid currency code', async () => {
            const invalidData: CreateAccountRequest = {
                code: 'ACC-001',
                name: 'Test Account',
                accountType: 'ASSET',
                currency: 'US',
            };

            await expect(policies.validateCreate(invalidData)).rejects.toThrow(ValidationError);
            await expect(policies.validateCreate(invalidData)).rejects.toThrow('3-letter ISO code');
        });
    });

    describe('validateParentChild', () => {
        it('should pass for matching account types', async () => {
            const parent: Account = {
                id: 1,
                tenantId: 'tenant1',
                code: 'ACC',
                name: 'Parent Account',
                parentId: null,
                accountType: 'ASSET',
                normalBalance: 'DEBIT',
                currency: 'USD',
                isActive: true,
                allowPosting: true,
                level: 1,
                effectiveStartDate: new Date(),
                effectiveEndDate: null,
                createdAt: new Date(),
                createdBy: 'system',
                updatedAt: new Date(),
                updatedBy: 'system',
            };

            const child: CreateAccountRequest = {
                code: 'ACC-001',
                name: 'Child Account',
                accountType: 'ASSET',
            };

            await expect(policies.validateParentChild(parent, child)).resolves.not.toThrow();
        });

        it('should reject mismatched account types', async () => {
            const parent: Account = {
                id: 1,
                tenantId: 'tenant1',
                code: 'ACC',
                name: 'Parent Account',
                parentId: null,
                accountType: 'ASSET',
                normalBalance: 'DEBIT',
                currency: 'USD',
                isActive: true,
                allowPosting: true,
                level: 1,
                effectiveStartDate: new Date(),
                effectiveEndDate: null,
                createdAt: new Date(),
                createdBy: 'system',
                updatedAt: new Date(),
                updatedBy: 'system',
            };

            const child: CreateAccountRequest = {
                code: 'LIA-001',
                name: 'Child Account',
                accountType: 'LIABILITY',
            };

            await expect(policies.validateParentChild(parent, child)).rejects.toThrow(ValidationError);
            await expect(policies.validateParentChild(parent, child)).rejects.toThrow('must match parent type');
        });

        it('should reject child code not starting with parent code', async () => {
            const parent: Account = {
                id: 1,
                tenantId: 'tenant1',
                code: 'ACC',
                name: 'Parent Account',
                parentId: null,
                accountType: 'ASSET',
                normalBalance: 'DEBIT',
                currency: 'USD',
                isActive: true,
                allowPosting: true,
                level: 1,
                effectiveStartDate: new Date(),
                effectiveEndDate: null,
                createdAt: new Date(),
                createdBy: 'system',
                updatedAt: new Date(),
                updatedBy: 'system',
            };

            const child: CreateAccountRequest = {
                code: 'OTHER-001',
                name: 'Child Account',
                accountType: 'ASSET',
            };

            await expect(policies.validateParentChild(parent, child)).rejects.toThrow(ValidationError);
            await expect(policies.validateParentChild(parent, child)).rejects.toThrow('must start with parent code');
        });

        it('should reject when max depth exceeded', async () => {
            const parent: Account = {
                id: 1,
                tenantId: 'tenant1',
                code: 'ACC',
                name: 'Parent Account',
                parentId: null,
                accountType: 'ASSET',
                normalBalance: 'DEBIT',
                currency: 'USD',
                isActive: true,
                allowPosting: true,
                level: 5,
                effectiveStartDate: new Date(),
                effectiveEndDate: null,
                createdAt: new Date(),
                createdBy: 'system',
                updatedAt: new Date(),
                updatedBy: 'system',
            };

            const child: CreateAccountRequest = {
                code: 'ACC-001',
                name: 'Child Account',
                accountType: 'ASSET',
            };

            await expect(policies.validateParentChild(parent, child)).rejects.toThrow(ValidationError);
            await expect(policies.validateParentChild(parent, child)).rejects.toThrow('Maximum hierarchy depth');
        });
    });

    describe('validateArchive', () => {
        it('should pass for valid archive', async () => {
            const account: Account = {
                id: 1,
                tenantId: 'tenant1',
                code: 'ACC-001',
                name: 'Test Account',
                parentId: null,
                accountType: 'ASSET',
                normalBalance: 'DEBIT',
                currency: 'USD',
                isActive: true,
                allowPosting: true,
                level: 1,
                effectiveStartDate: new Date(),
                effectiveEndDate: null,
                createdAt: new Date(),
                createdBy: 'system',
                updatedAt: new Date(),
                updatedBy: 'system',
            };

            await expect(policies.validateArchive(account, false)).resolves.not.toThrow();
        });

        it('should reject archiving already archived account', async () => {
            const account: Account = {
                id: 1,
                tenantId: 'tenant1',
                code: 'ACC-001',
                name: 'Test Account',
                parentId: null,
                accountType: 'ASSET',
                normalBalance: 'DEBIT',
                currency: 'USD',
                isActive: false,
                allowPosting: true,
                level: 1,
                effectiveStartDate: new Date(),
                effectiveEndDate: null,
                createdAt: new Date(),
                createdBy: 'system',
                updatedAt: new Date(),
                updatedBy: 'system',
            };

            await expect(policies.validateArchive(account, false)).rejects.toThrow(ValidationError);
            await expect(policies.validateArchive(account, false)).rejects.toThrow('already archived');
        });

        it('should reject archiving account with children', async () => {
            const account: Account = {
                id: 1,
                tenantId: 'tenant1',
                code: 'ACC-001',
                name: 'Test Account',
                parentId: null,
                accountType: 'ASSET',
                normalBalance: 'DEBIT',
                currency: 'USD',
                isActive: true,
                allowPosting: true,
                level: 1,
                effectiveStartDate: new Date(),
                effectiveEndDate: null,
                createdAt: new Date(),
                createdBy: 'system',
                updatedAt: new Date(),
                updatedBy: 'system',
            };

            await expect(policies.validateArchive(account, true)).rejects.toThrow(ValidationError);
            await expect(policies.validateArchive(account, true)).rejects.toThrow('child accounts');
        });
    });
});
