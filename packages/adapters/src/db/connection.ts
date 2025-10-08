import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './core-ledger/schema';

/**
 * Database connection singleton
 * Uses postgres.js with Supabase transaction pooler for serverless optimization
 */

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:Weepohlai88!@localhost:54322/postgres';

// Configure for Supabase transaction pooler (serverless-optimized)
const client = postgres(DATABASE_URL, {
    max: 1, // Single connection for transaction pooler
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false, // Required for transaction pooler mode
});

export const db = drizzle(client, { schema });

export type Database = typeof db;

/**
 * Helper to get tenant context from request
 * Assumes auth middleware has set tenantId on request
 */
export interface TenantContext {
    tenantId: string;
    userId: string;
}

let currentContext: TenantContext | null = null;

export function setTenantContext(context: TenantContext): void {
    currentContext = context;
}

export function getTenantContext(): TenantContext {
    if (!currentContext) {
        throw new Error('Tenant context not set. Ensure auth middleware is configured.');
    }
    return currentContext;
}

export function clearTenantContext(): void {
    currentContext = null;
}
