import { z } from 'zod';

// Account Type Enum
export const accountTypeSchema = z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']);

// Normal Balance Enum
export const normalBalanceSchema = z.enum(['DEBIT', 'CREDIT']);

// Create Account Request
export const createAccountSchema = z.object({
    code: z
        .string()
        .min(3, 'Account code must be at least 3 characters')
        .max(50, 'Account code must be at most 50 characters')
        .regex(
            /^[A-Z0-9-]+$/,
            'Account code must contain only uppercase letters, numbers, and hyphens'
        ),
    name: z
        .string()
        .min(1, 'Account name is required')
        .max(255, 'Account name must be at most 255 characters'),
    parentId: z.number().int().positive().optional(),
    accountType: accountTypeSchema,
    currency: z.string().length(3).default('USD'),
    allowPosting: z.boolean().default(true),
});

// Update Account Request
export const updateAccountSchema = z.object({
    code: z
        .string()
        .min(3, 'Account code must be at least 3 characters')
        .max(50, 'Account code must be at most 50 characters')
        .regex(
            /^[A-Z0-9-]+$/,
            'Account code must contain only uppercase letters, numbers, and hyphens'
        )
        .optional(),
    name: z
        .string()
        .min(1, 'Account name is required')
        .max(255, 'Account name must be at most 255 characters')
        .optional(),
    parentId: z.number().int().positive().optional(),
    accountType: accountTypeSchema.optional(),
    normalBalance: normalBalanceSchema.optional(),
    currency: z.string().length(3).optional(),
    isActive: z.boolean().optional(),
    allowPosting: z.boolean().optional(),
});

// Account Response
export const accountResponseSchema = z.object({
    id: z.number().int().positive(),
    code: z.string(),
    name: z.string(),
    parentId: z.number().int().positive().nullable(),
    accountType: accountTypeSchema,
    normalBalance: normalBalanceSchema,
    currency: z.string(),
    isActive: z.boolean(),
    allowPosting: z.boolean(),
    level: z.number().int().min(1),
    effectiveStartDate: z.string(),
    effectiveEndDate: z.string().nullable(),
    createdAt: z.string(),
    createdBy: z.string(),
    updatedAt: z.string(),
    updatedBy: z.string(),
});

// Account Hierarchy Node
export const accountHierarchyNodeSchema: z.ZodType<{
    id: number;
    code: string;
    name: string;
    parentId: number | null;
    accountType: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
    normalBalance: 'DEBIT' | 'CREDIT';
    currency: string;
    isActive: boolean;
    allowPosting: boolean;
    level: number;
    effectiveStartDate: string;
    effectiveEndDate: string | null;
    createdAt: string;
    createdBy: string;
    updatedAt: string;
    updatedBy: string;
    children: unknown[];
}> = accountResponseSchema.extend({
    children: z.array(z.lazy(() => accountHierarchyNodeSchema)),
});

// Account Hierarchy Response
export const accountHierarchyResponseSchema = z.object({
    accounts: z.array(accountResponseSchema),
    hierarchy: z.array(accountHierarchyNodeSchema),
});

// Reparent Request
export const reparentRequestSchema = z.object({
    newParentId: z.number().int().positive().nullable(),
});

// Reparent Validation Response
export const reparentValidationResponseSchema = z.object({
    valid: z.boolean(),
    message: z.string(),
});

// Search Filters
export const searchFiltersSchema = z.object({
    accountType: accountTypeSchema.optional(),
    currency: z.string().length(3).optional(),
    isActive: z.boolean().optional(),
    allowPosting: z.boolean().optional(),
});

// Query parameters for search
export const searchQuerySchema = z.object({
    q: z.string().optional().default(''),
    accountType: accountTypeSchema.optional(),
    currency: z.string().length(3).optional(),
    isActive: z.coerce.boolean().optional(),
    allowPosting: z.coerce.boolean().optional(),
});

// Export inferred types
export type CreateAccountRequest = z.infer<typeof createAccountSchema>;
export type UpdateAccountRequest = z.infer<typeof updateAccountSchema>;
export type AccountResponse = z.infer<typeof accountResponseSchema>;
export type AccountHierarchyNode = z.infer<typeof accountHierarchyNodeSchema>;
export type AccountHierarchyResponse = z.infer<typeof accountHierarchyResponseSchema>;
export type ReparentRequest = z.infer<typeof reparentRequestSchema>;
export type ReparentValidationResponse = z.infer<typeof reparentValidationResponseSchema>;
export type SearchFilters = z.infer<typeof searchFiltersSchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;