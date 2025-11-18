-- Fix: Reset customers table sequence to prevent duplicate key errors
--
-- Problem: The customerid sequence is out of sync with the actual data,
-- causing new INSERTs to try using customerid values that already exist.
--
-- Solution: Reset the sequence to the MAX(customerid) + 1

-- Reset the sequence to the highest existing customerid value
SELECT setval('customers_id_seq', (SELECT COALESCE(MAX(customerid), 0) FROM customers));

-- Verify the fix
SELECT
    'Current sequence value:' as info,
    last_value as current_value,
    is_called
FROM customers_id_seq;

SELECT
    'Highest customerid in table:' as info,
    COALESCE(MAX(customerid), 0) as max_id,
    COUNT(*) as total_customers
FROM customers;
