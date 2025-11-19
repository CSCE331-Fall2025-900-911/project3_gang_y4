-- Create inventory_transactions table for audit trail
-- This table logs all inventory changes (orders, restocks, adjustments)

CREATE TABLE IF NOT EXISTS inventory_transactions (
  transaction_id SERIAL PRIMARY KEY,
  inventory_id INTEGER REFERENCES inventory(ingredientid) ON DELETE CASCADE,
  order_id INTEGER REFERENCES sales_orders(order_id) ON DELETE SET NULL,
  quantity_change DECIMAL(10,2) NOT NULL,  -- Negative for decrements, positive for restocks
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('order', 'restock', 'adjustment')),
  transaction_date TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'America/Chicago'),
  employee_id INTEGER,  -- Who performed the transaction (for restocks/adjustments)
  notes TEXT,
  CONSTRAINT valid_quantity CHECK (quantity_change != 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inv_trans_inventory_id ON inventory_transactions(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inv_trans_order_id ON inventory_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_inv_trans_date ON inventory_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_inv_trans_type ON inventory_transactions(transaction_type);

-- Add reorder_level and last_restocked columns to inventory table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='inventory' AND column_name='reorder_level') THEN
    ALTER TABLE inventory ADD COLUMN reorder_level INTEGER DEFAULT 10;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='inventory' AND column_name='last_restocked') THEN
    ALTER TABLE inventory ADD COLUMN last_restocked TIMESTAMP;
  END IF;
END $$;

-- Create a view for low stock items
CREATE OR REPLACE VIEW low_stock_inventory AS
SELECT
  i.ingredientid,
  i.item_name,
  i.quantity as current_stock,
  i.reorder_level,
  (i.quantity - i.reorder_level) as stock_difference,
  i.last_restocked,
  CASE
    WHEN i.quantity = 0 THEN 'OUT_OF_STOCK'
    WHEN i.quantity <= i.reorder_level THEN 'LOW_STOCK'
    ELSE 'IN_STOCK'
  END as stock_status
FROM inventory i
WHERE i.quantity <= i.reorder_level
ORDER BY i.quantity ASC;

COMMENT ON TABLE inventory_transactions IS 'Audit trail for all inventory changes including orders, restocks, and manual adjustments';
COMMENT ON COLUMN inventory_transactions.quantity_change IS 'Negative values = decrement (order), Positive values = increment (restock/adjustment)';
COMMENT ON VIEW low_stock_inventory IS 'Shows all inventory items at or below reorder level';
