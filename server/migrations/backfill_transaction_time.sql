-- Migration: Fix data issues and backfill transaction_time for orders 1-7
-- This script performs data cleanup and adds transaction_time to order_details JSON

-- Task 1: Fix orders 5 and 6 data issues
-- Fix customer_id = 'Guest' to customer_id = 0 (integer)
UPDATE sales_orders
SET customer_id = 0
WHERE order_id = 5 AND customer_id = 'Guest';

-- Fix employee_id NULL to employee_id = 0 (self-service kiosk)
UPDATE sales_orders
SET employee_id = 0
WHERE order_id IN (5, 6) AND employee_id IS NULL;

-- Fix incorrect subtotal/tax/total for order 5
UPDATE sales_orders
SET subtotal = 9.50, tax = 0.78, total = 10.28
WHERE order_id = 5;

-- Task 2 & 3: Backfill transaction_time for all orders 1-7
-- This adds the transaction_time field to order_details JSON using the order_date value
UPDATE sales_orders
SET order_details = jsonb_set(
  order_details,
  '{transaction_time}',
  to_jsonb(order_date::text)
)
WHERE order_id <= 7;

-- Verify all updates
SELECT
  order_id,
  customer_id,
  employee_id,
  subtotal,
  tax,
  total,
  order_date,
  order_details->'transaction_time' as transaction_time
FROM sales_orders
WHERE order_id <= 7
ORDER BY order_id;
