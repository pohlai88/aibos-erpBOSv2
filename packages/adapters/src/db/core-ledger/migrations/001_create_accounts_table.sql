-- Migration: 001_create_accounts_table.sql
-- Description: Core Ledger - Chart of Accounts with multi-tenant RLS
-- Date: 2025-01-07

-- Enable Row Level Security
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE account_type AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');
CREATE TYPE normal_balance AS ENUM ('DEBIT', 'CREDIT');

-- Create accounts table
CREATE TABLE accounts (
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

-- Composite unique constraint: tenant + code
CREATE UNIQUE INDEX idx_accounts_tenant_code ON accounts(tenant_id, code);

-- Performance indexes
CREATE INDEX idx_accounts_parent_id ON accounts(parent_id);
CREATE INDEX idx_accounts_tenant_id ON accounts(tenant_id);
CREATE INDEX idx_accounts_account_type ON accounts(account_type);
CREATE INDEX idx_accounts_active ON accounts(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_accounts_code ON accounts(code);
CREATE INDEX idx_accounts_level ON accounts(level);

-- Check constraints for data integrity
ALTER TABLE accounts ADD CONSTRAINT chk_account_type_balance_invariant
  CHECK (
    (account_type = 'ASSET' AND normal_balance = 'DEBIT') OR
    (account_type = 'LIABILITY' AND normal_balance = 'CREDIT') OR
    (account_type = 'EQUITY' AND normal_balance = 'CREDIT') OR
    (account_type = 'REVENUE' AND normal_balance = 'CREDIT') OR
    (account_type = 'EXPENSE' AND normal_balance = 'DEBIT')
  );

ALTER TABLE accounts ADD CONSTRAINT chk_code_format
  CHECK (code ~* '^[A-Z0-9-]+$' AND length(code) >= 3);

ALTER TABLE accounts ADD CONSTRAINT chk_currency_format
  CHECK (currency ~* '^[A-Z]{3}$');

ALTER TABLE accounts ADD CONSTRAINT chk_level_positive
  CHECK (level >= 1 AND level <= 5);

-- Row Level Security (RLS) Policies
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see accounts in their tenant
CREATE POLICY accounts_tenant_isolation ON accounts
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant')::TEXT);

-- Function to set tenant context
CREATE OR REPLACE FUNCTION set_tenant_context(p_tenant_id TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_tenant', p_tenant_id, false);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE accounts IS 'Chart of Accounts - foundation of financial transactions';
COMMENT ON COLUMN accounts.tenant_id IS 'Multi-tenant isolation key';
COMMENT ON COLUMN accounts.code IS 'Unique account code per tenant (e.g., 1000-CASH)';
COMMENT ON COLUMN accounts.normal_balance IS 'Derived invariant from account_type';
COMMENT ON COLUMN accounts.level IS 'Hierarchy depth (1=root, max 5)';
COMMENT ON COLUMN accounts.allow_posting IS 'If FALSE, account is for grouping only';
COMMENT ON CONSTRAINT chk_account_type_balance_invariant ON accounts IS 'Enforces normal balance invariant';
COMMENT ON INDEX idx_accounts_tenant_code ON accounts IS 'Ensures code uniqueness per tenant';
