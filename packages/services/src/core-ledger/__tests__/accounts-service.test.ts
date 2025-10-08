import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AccountsServiceImpl } from '../accounts-service';
import type {
    AccountsRepository,
    Account,
    CreateAccountRequest,
    UpdateAccountRequest,
} from '@aibos/ports/core-ledger/accounts-port';
import type { AccountsPolicies } from '@aibos/policies/core-ledger/accounts-policies';
import type { Logger } from '@aibos/ports/shared/logger-port';
import { NotFoundError, BusinessError } from '@aibos/contracts/shared/errors';
import type { TenantContext } from '@aibos/adapters/db/connection';
import type { MockedObject } from 'vitest';

describe('AccountsServiceImpl', () => {
    let service: AccountsServiceImpl;
    let mockRepository: MockedObject<AccountsRepository>;
    let mockPolicies: MockedObject<AccountsPolicies>;
    let mockLogger: MockedObject<Logger>;
    let tenantContext: TenantContext;

    const mockAccount: Account = {
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
        effectiveStartDate: new Date('2025-01-01'),
        effectiveEndDate: null,
        createdAt: new Date('2025-01-01'),
        createdBy: 'system',
        updatedAt: new Date('2025-01-01'),
        updatedBy: 'system',
    };

    beforeEach(() => {
        mockRepository = {
            create: vi.fn(),
            findById: vi.fn(),
            findByCode: vi.fn(),
            findChildren: vi.fn(),
            findHierarchy: vi.fn(),
            search: vi.fn(),
            update: vi.fn(),
            archive: vi.fn(),
            reparent: vi.fn(),
            hasChildren: vi.fn(),
        } as MockedObject<AccountsRepository>;

        mockPolicies = {
            validateCreate: vi.fn(),
            validateUpdate: vi.fn(),
            validateParentChild: vi.fn(),
            validateArchive: vi.fn(),
            validateReparent: vi.fn(),
        } as MockedObject<AccountsPolicies>;

        mockLogger = {
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            debug: vi.fn(),
        };

        tenantContext = {
            tenantId: 'tenant1',
            userId: 'user1',
        };

        service = new AccountsServiceImpl(mockRepository, mockPolicies, mockLogger, tenantContext);
    });

    describe('createAccount', () => {
        it('should create account with derived normal balance (ASSET = DEBIT)', async () => {
            const request: CreateAccountRequest = {
                code: 'ACC-001',
                name: 'Test Asset',
                accountType: 'ASSET',
            };

            mockPolicies.validateCreate.mockResolvedValue(undefined);
            mockRepository.findByCode.mockResolvedValue(null);
            mockRepository.create.mockResolvedValue(mockAccount);

            const result = await service.createAccount(request);

            expect(mockRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    normalBalance: 'DEBIT',
                    tenantId: 'tenant1',
                    createdBy: 'user1',
                    updatedBy: 'user1',
                })
            );
            expect(result.normalBalance).toBe('DEBIT');
        });

        it('should create account with derived normal balance (LIABILITY = CREDIT)', async () => {
            const request: CreateAccountRequest = {
                code: 'LIA-001',
                name: 'Test Liability',
                accountType: 'LIABILITY',
            };

            const liabilityAccount = { ...mockAccount, accountType: 'LIABILITY' as const, normalBalance: 'CREDIT' as const };

            mockPolicies.validateCreate.mockResolvedValue(undefined);
            mockRepository.findByCode.mockResolvedValue(null);
            mockRepository.create.mockResolvedValue(liabilityAccount);

            const result = await service.createAccount(request);

            expect(mockRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    normalBalance: 'CREDIT',
                })
            );
            expect(result.normalBalance).toBe('CREDIT');
        });

        it('should create account with derived normal balance (EXPENSE = DEBIT)', async () => {
            const request: CreateAccountRequest = {
                code: 'EXP-001',
                name: 'Test Expense',
                accountType: 'EXPENSE',
            };

            const expenseAccount = { ...mockAccount, accountType: 'EXPENSE' as const, normalBalance: 'DEBIT' as const };

            mockPolicies.validateCreate.mockResolvedValue(undefined);
            mockRepository.findByCode.mockResolvedValue(null);
            mockRepository.create.mockResolvedValue(expenseAccount);

            const result = await service.createAccount(request);

            expect(mockRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    normalBalance: 'DEBIT',
                })
            );
            expect(result.normalBalance).toBe('DEBIT');
        });

        it('should throw BusinessError for duplicate code', async () => {
            const request: CreateAccountRequest = {
                code: 'ACC-001',
                name: 'Test Account',
                accountType: 'ASSET',
            };

            mockPolicies.validateCreate.mockResolvedValue(undefined);
            mockRepository.findByCode.mockResolvedValue(mockAccount);

            await expect(service.createAccount(request)).rejects.toThrow(BusinessError);
            await expect(service.createAccount(request)).rejects.toThrow('already exists');
        });

        it('should validate parent account when parentId provided', async () => {
            const parentAccount = { ...mockAccount, id: 1, code: 'ACC' };
            const request: CreateAccountRequest = {
                code: 'ACC-001',
                name: 'Child Account',
                accountType: 'ASSET',
                parentId: 1,
            };

            mockPolicies.validateCreate.mockResolvedValue(undefined);
            mockRepository.findByCode.mockResolvedValue(null);
            mockRepository.findById.mockResolvedValue(parentAccount);
            mockPolicies.validateParentChild.mockResolvedValue(undefined);
            mockRepository.create.mockResolvedValue(mockAccount);

            await service.createAccount(request);

            expect(mockRepository.findById).toHaveBeenCalledWith(1, 'tenant1');
            expect(mockPolicies.validateParentChild).toHaveBeenCalledWith(parentAccount, request);
        });

        it('should throw NotFoundError for invalid parentId', async () => {
            const request: CreateAccountRequest = {
                code: 'ACC-001',
                name: 'Child Account',
                accountType: 'ASSET',
                parentId: 999,
            };

            mockPolicies.validateCreate.mockResolvedValue(undefined);
            mockRepository.findByCode.mockResolvedValue(null);
            mockRepository.findById.mockResolvedValue(null);

            await expect(service.createAccount(request)).rejects.toThrow(NotFoundError);
            await expect(service.createAccount(request)).rejects.toThrow('Parent account not found');
        });
    });

    describe('updateAccount', () => {
        it('should auto-adjust normalBalance when accountType changes', async () => {
            const request: UpdateAccountRequest = {
                accountType: 'LIABILITY',
            };

            mockPolicies.validateUpdate.mockResolvedValue(undefined);
            mockRepository.findById.mockResolvedValue(mockAccount);
            mockRepository.update.mockResolvedValue({ ...mockAccount, accountType: 'LIABILITY', normalBalance: 'CREDIT' });

            await service.updateAccount(1, request);

            expect(mockRepository.update).toHaveBeenCalledWith(
                1,
                'tenant1',
                expect.objectContaining({
                    accountType: 'LIABILITY',
                    normalBalance: 'CREDIT',
                    updatedBy: 'user1',
                })
            );
        });

        it('should not adjust normalBalance if explicitly provided', async () => {
            // Note: normalBalance is not part of UpdateAccountRequest API contract,
            // but testing internal UpdateAccountData handling
            const request = {
                accountType: 'LIABILITY',
                normalBalance: 'DEBIT', // Explicitly overriding (for testing purposes)
            } as UpdateAccountRequest & { normalBalance: 'DEBIT' };

            mockPolicies.validateUpdate.mockResolvedValue(undefined);
            mockRepository.findById.mockResolvedValue(mockAccount);
            mockRepository.update.mockResolvedValue({ ...mockAccount, accountType: 'LIABILITY', normalBalance: 'DEBIT' });

            await service.updateAccount(1, request);

            expect(mockRepository.update).toHaveBeenCalledWith(
                1,
                'tenant1',
                expect.objectContaining({
                    normalBalance: 'DEBIT', // Should preserve explicit value
                })
            );
        });

        it('should throw NotFoundError for non-existent account', async () => {
            const request: UpdateAccountRequest = {
                name: 'Updated Name',
            };

            mockPolicies.validateUpdate.mockResolvedValue(undefined);
            mockRepository.findById.mockResolvedValue(null);

            await expect(service.updateAccount(999, request)).rejects.toThrow(NotFoundError);
        });
    });

    describe('archiveAccount', () => {
        it('should archive account successfully', async () => {
            mockRepository.findById.mockResolvedValue(mockAccount);
            mockRepository.hasChildren.mockResolvedValue(false);
            mockPolicies.validateArchive.mockResolvedValue(undefined);
            mockRepository.archive.mockResolvedValue({ ...mockAccount, isActive: false });

            await service.archiveAccount(1);

            expect(mockRepository.archive).toHaveBeenCalledWith(1, 'tenant1', 'user1');
        });

        it('should throw NotFoundError for non-existent account', async () => {
            mockRepository.findById.mockResolvedValue(null);

            await expect(service.archiveAccount(999)).rejects.toThrow(NotFoundError);
        });

        it('should validate before archiving', async () => {
            mockRepository.findById.mockResolvedValue(mockAccount);
            mockRepository.hasChildren.mockResolvedValue(true);
            mockPolicies.validateArchive.mockRejectedValue(new Error('Has children'));

            await expect(service.archiveAccount(1)).rejects.toThrow('Has children');
        });
    });

    describe('getAccountHierarchy', () => {
        it('should build hierarchical tree structure', async () => {
            const accounts: Account[] = [
                mockAccount,
                { ...mockAccount, id: 2, code: 'ACC-001-A', parentId: 1, level: 2 },
                { ...mockAccount, id: 3, code: 'ACC-001-B', parentId: 1, level: 2 },
            ];

            mockRepository.findHierarchy.mockResolvedValue(accounts);

            const result = await service.getAccountHierarchy();

            expect(result.hierarchy).toHaveLength(1); // One root node
            expect(result.hierarchy[0]?.children).toHaveLength(2); // Two children
            expect(result.accounts).toHaveLength(3); // Flat list
        });
    });

    describe('validateReparent', () => {
        it('should validate successful reparent', async () => {
            const newParent = { ...mockAccount, id: 2, code: 'ACC-002', level: 1 };
            const account = { ...mockAccount, id: 3, code: 'ACC-002-001', level: 2 };

            mockRepository.findById
                .mockResolvedValueOnce(account)
                .mockResolvedValueOnce(newParent);
            mockPolicies.validateReparent.mockResolvedValue(undefined);

            const result = await service.validateReparent(3, 2);

            expect(result.valid).toBe(true);
        });

        it('should detect circular reference', async () => {
            const account = { ...mockAccount, id: 1, code: 'ACC-001', parentId: 2 };
            const newParent = { ...mockAccount, id: 2, code: 'ACC-002', parentId: null };

            mockRepository.findById
                .mockResolvedValueOnce(account)
                .mockResolvedValueOnce(newParent)
                .mockResolvedValueOnce(account); // Circular

            mockPolicies.validateReparent.mockRejectedValue(new Error('Circular reference'));

            const result = await service.validateReparent(2, 1);

            expect(result.valid).toBe(false);
        });
    });
});
