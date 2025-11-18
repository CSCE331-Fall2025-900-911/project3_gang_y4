-- Migration: Add unique constraint on customer email (username)
--
-- Problem: Multiple Google sign-ins can create duplicate customer records
-- with the same email due to race conditions or React component remounting.
--
-- Solution: Add a unique constraint so the database prevents duplicates.

-- Add unique constraint on username column (which stores email for OAuth users)
-- Use IF NOT EXISTS to make this migration idempotent
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'customers_username_unique'
    ) THEN
        ALTER TABLE customers ADD CONSTRAINT customers_username_unique UNIQUE (username);
        RAISE NOTICE 'Added unique constraint on customers.username';
    ELSE
        RAISE NOTICE 'Unique constraint already exists, skipping';
    END IF;
END $$;

-- Verify the constraint exists
SELECT
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'customers'::regclass
    AND conname = 'customers_username_unique';
