import { ValidationError } from '@aibos/contracts/shared/errors';
import type {
    Account,
    AccountType,
    CreateAccountRequest,
    UpdateAccountRequest,
} from '@aibos/ports/core-ledger/accounts-port';

/**
 * Accounts Policies - Business rules and validation
 * Instance methods (not static) for dependency injection
 */
export class AccountsPolicies {
    /**
     * Validate account creation request
     */
    async validateCreate(data: CreateAccountRequest): Promise<void> {
        // Rule 1: Code format validation
        if (!data.code || data.code.length < 3) {
            throw new ValidationError('Account code must be at least 3 characters', 'code');
        }

        if (!/^[A-Z0-9-]+$/.test(data.code)) {
            throw new ValidationError(
                'Account code must contain only uppercase letters, numbers, and hyphens',
                'code'
            );
        }

        if (data.code.length > 50) {
            throw new ValidationError('Account code must not exceed 50 characters', 'code');
        }

        // Rule 2: Name validation
        if (!data.name || data.name.length < 5) {
            throw new ValidationError('Account name must be at least 5 characters', 'name');
        }

        if (data.name.length > 255) {
            throw new ValidationError('Account name must not exceed 255 characters', 'name');
        }

        // Rule 3: Account type validation (redundant with Zod, but explicit here)
        const validAccountTypes: AccountType[] = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];
        if (!validAccountTypes.includes(data.accountType)) {
            throw new ValidationError(
                `Account type must be one of: ${validAccountTypes.join(', ')}`,
                'accountType'
            );
        }

        // Rule 4: Currency validation
        if (data.currency && !/^[A-Z]{3}$/.test(data.currency)) {
            throw new ValidationError('Currency must be a valid 3-letter ISO code', 'currency');
        }
    }

    /**
     * Validate account update request
     */
    async validateUpdate(data: UpdateAccountRequest): Promise<void> {
        if (data.code !== undefined) {
            if (data.code.length < 3) {
                throw new ValidationError('Account code must be at least 3 characters', 'code');
            }

            if (!/^[A-Z0-9-]+$/.test(data.code)) {
                throw new ValidationError(
                    'Account code must contain only uppercase letters, numbers, and hyphens',
                    'code'
                );
            }

            if (data.code.length > 50) {
                throw new ValidationError('Account code must not exceed 50 characters', 'code');
            }
        }

        if (data.name !== undefined) {
            if (data.name.length < 5) {
                throw new ValidationError('Account name must be at least 5 characters', 'name');
            }

            if (data.name.length > 255) {
                throw new ValidationError('Account name must not exceed 255 characters', 'name');
            }
        }

        if (data.accountType !== undefined) {
            const validAccountTypes: AccountType[] = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];
            if (!validAccountTypes.includes(data.accountType)) {
                throw new ValidationError(
                    `Account type must be one of: ${validAccountTypes.join(', ')}`,
                    'accountType'
                );
            }
        }

        if (data.currency !== undefined && !/^[A-Z]{3}$/.test(data.currency)) {
            throw new ValidationError('Currency must be a valid 3-letter ISO code', 'currency');
        }
    }

    /**
     * Validate parent-child relationship
     */
    async validateParentChild(parent: Account, child: CreateAccountRequest): Promise<void> {
        // Rule 1: Account types must match
        if (parent.accountType !== child.accountType) {
            throw new ValidationError(
                `Child account type (${child.accountType}) must match parent type (${parent.accountType})`,
                'accountType'
            );
        }

        // Rule 2: Child code must start with parent code
        if (!child.code.startsWith(parent.code)) {
            throw new ValidationError(
                `Child account code must start with parent code (${parent.code})`,
                'code'
            );
        }

        // Rule 3: Hierarchy depth constraint (max 5 levels)
        if (parent.level >= 5) {
            throw new ValidationError(
                'Maximum hierarchy depth of 5 levels exceeded',
                'parentId'
            );
        }
    }

    /**
     * Validate account archival
     */
    async validateArchive(account: Account, hasChildren: boolean): Promise<void> {
        // Rule 1: Cannot archive if already archived
        if (!account.isActive) {
            throw new ValidationError('Account is already archived');
        }

        // Rule 2: Cannot archive if has children
        if (hasChildren) {
            throw new ValidationError(
                'Cannot archive account with child accounts. Archive children first.',
                'id'
            );
        }

        // Rule 3: Cannot archive if has non-zero balance
        // NOTE: This check would require integration with transaction/balance module
        // For now, we document the requirement
        // TODO: Add balance check once transaction module is available

        // Rule 4: Cannot archive if used in open periods
        // NOTE: This check would require integration with period module
        // For now, we document the requirement
        // TODO: Add period check once period module is available
    }

    /**
     * Validate reparenting operation
     */
    async validateReparent(
        account: Account,
        newParent: Account | null,
        wouldCreateCycle: boolean
    ): Promise<void> {
        // Rule 1: Cannot reparent to itself
        if (newParent && newParent.id === account.id) {
            throw new ValidationError('Cannot set account as its own parent', 'newParentId');
        }

        // Rule 2: Cannot create circular reference
        if (wouldCreateCycle) {
            throw new ValidationError(
                'Reparenting would create a circular reference in the hierarchy',
                'newParentId'
            );
        }

        // Rule 3: Account types must match
        if (newParent && account.accountType !== newParent.accountType) {
            throw new ValidationError(
                `Account types must match. Cannot reparent ${account.accountType} under ${newParent.accountType}`,
                'newParentId'
            );
        }

        // Rule 4: Depth constraint (new parent level < 5)
        if (newParent && newParent.level >= 5) {
            throw new ValidationError(
                'Maximum hierarchy depth would be exceeded',
                'newParentId'
            );
        }

        // Rule 5: Code prefix compatibility (child code should start with parent code)
        if (newParent && !account.code.startsWith(newParent.code)) {
            throw new ValidationError(
                `Account code (${account.code}) does not start with new parent code (${newParent.code})`,
                'newParentId'
            );
        }
    }
}
