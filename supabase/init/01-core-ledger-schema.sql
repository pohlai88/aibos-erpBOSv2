-- AIBOS ERP Core Ledger Database Schema
-- Initialization script for Supabase Docker setup

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums for Core Ledger
DO $$ BEGIN
    CREATE TYPE account_type AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE normal_balance AS ENUM ('DEBIT', 'CREDIT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create accounts table with multi-tenant support
CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  parent_id INTEGER REFERENCES accounts(id),
  account_type account_type NOT NULL,
  normal_balance normal_balance NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  allow_posting BOOLEAN NOT NULL DEFAULT TRUE,
  level INTEGER NOT NULL DEFAULT 1,
  effective_start_date TIMESTAMP NOT NULL DEFAULT NOW(),
  effective_end_date TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255) NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_by VARCHAR(255) NOT NULL
);

-- Create indexes for performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_tenant_code ON accounts(tenant_id, code);
CREATE INDEX IF NOT EXISTS idx_accounts_parent_id ON accounts(parent_id);
CREATE INDEX IF NOT EXISTS idx_accounts_tenant_id ON accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_accounts_account_type ON accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_accounts_active ON accounts(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_accounts_code ON accounts(code);
CREATE INDEX IF NOT EXISTS idx_accounts_level ON accounts(level);

-- Add business rule constraints
DO $$ BEGIN
    ALTER TABLE accounts ADD CONSTRAINT chk_account_type_balance_invariant
      CHECK (
        (account_type = 'ASSET' AND normal_balance = 'DEBIT') OR
        (account_type = 'LIABILITY' AND normal_balance = 'CREDIT') OR
        (account_type = 'EQUITY' AND normal_balance = 'CREDIT') OR
        (account_type = 'REVENUE' AND normal_balance = 'CREDIT') OR
        (account_type = 'EXPENSE' AND normal_balance = 'DEBIT')
      );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enable Row Level Security
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for multi-tenant isolation
DO $$ BEGIN
    CREATE POLICY "Users can view accounts for their tenant" ON accounts
      FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert accounts for their tenant" ON accounts
      FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update accounts for their tenant" ON accounts
      FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id', true));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can delete accounts for their tenant" ON accounts
      FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id', true));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Insert sample data for testing
INSERT INTO accounts (tenant_id, code, name, account_type, normal_balance, currency, created_by, updated_by) VALUES
  ('sandbox', 'ASSET-001', 'Cash and Cash Equivalents', 'ASSET', 'DEBIT', 'USD', 'system', 'system'),
  ('sandbox', 'ASSET-002', 'Accounts Receivable', 'ASSET', 'DEBIT', 'USD', 'system', 'system'),
  ('sandbox', 'ASSET-003', 'Inventory', 'ASSET', 'DEBIT', 'USD', 'system', 'system'),
  ('sandbox', 'LIAB-001', 'Accounts Payable', 'LIABILITY', 'CREDIT', 'USD', 'system', 'system'),
  ('sandbox', 'LIAB-002', 'Accrued Expenses', 'LIABILITY', 'CREDIT', 'USD', 'system', 'system'),
  ('sandbox', 'EQUITY-001', 'Owner Equity', 'EQUITY', 'CREDIT', 'USD', 'system', 'system'),
  ('sandbox', 'REV-001', 'Sales Revenue', 'REVENUE', 'CREDIT', 'USD', 'system', 'system'),
  ('sandbox', 'EXP-001', 'Cost of Goods Sold', 'EXPENSE', 'DEBIT', 'USD', 'system', 'system'),
  ('sandbox', 'EXP-002', 'Operating Expenses', 'EXPENSE', 'DEBIT', 'USD', 'system', 'system')
ON CONFLICT (tenant_id, code) DO NOTHING;

-- Create a function to set tenant context (for RLS)
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_id TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', tenant_id, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres;
GRANT ALL ON TABLE accounts TO postgres;
GRANT USAGE, SELECT ON SEQUENCE accounts_id_seq TO postgres;
GRANT EXECUTE ON FUNCTION set_tenant_context(TEXT) TO postgres;

-- Create a view for easier querying (optional)
CREATE OR REPLACE VIEW accounts_view AS
SELECT 
  id,
  tenant_id,
  code,
  name,
  parent_id,
  account_type,
  normal_balance,
  currency,
  is_active,
  allow_posting,
  level,
  effective_start_date,
  effective_end_date,
  created_at,
  created_by,
  updated_at,
  updated_by
FROM accounts
WHERE is_active = TRUE;

-- Grant access to the view
GRANT SELECT ON accounts_view TO postgres;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'AIBOS ERP Core Ledger schema created successfully!';
  RAISE NOTICE 'Sample data inserted for tenant: sandbox';
  RAISE NOTICE 'RLS policies configured for multi-tenant isolation';
END $$;
