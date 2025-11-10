-- Create sales_orders table to store transaction details
-- This replaces or supplements your existing 'sales' table

CREATE TABLE IF NOT EXISTS sales_orders (
    order_id SERIAL PRIMARY KEY,
    customer_id VARCHAR(255) DEFAULT 'guest',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    order_details JSONB NOT NULL,  -- Stores the structured order data
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    order_status VARCHAR(50) DEFAULT 'completed',
    employee_id INTEGER,  -- Optional: who processed the order
    CONSTRAINT valid_totals CHECK (total = subtotal + tax)
);

-- Create index on customer_id for faster lookups
CREATE INDEX idx_customer_id ON sales_orders(customer_id);

-- Create index on order_date for reporting
CREATE INDEX idx_order_date ON sales_orders(order_date);

-- Example of how data will be stored:
/*
INSERT INTO sales_orders (customer_id, order_details, subtotal, tax, total) 
VALUES (
    'guest',
    '{
        "items": [
            {
                "menu_id": 4,
                "name": "KF Milk Tea - Medium",
                "base_price": 4.75,
                "quantity": 1,
                "customizations": [
                    {"menu_id": 47, "name": "Boba", "price": 0.75},
                    {"menu_id": 56, "name": "Light Ice", "price": 0.00},
                    {"menu_id": 60, "name": "Half Sweet (50%)", "price": 0.00}
                ],
                "item_total": 5.50
            },
            {
                "menu_id": 16,
                "name": "Strawberry Milk Slush - Medium",
                "base_price": 5.75,
                "quantity": 2,
                "customizations": [
                    {"menu_id": 47, "name": "Boba", "price": 0.75}
                ],
                "item_total": 13.00
            }
        ],
        "order_notes": ""
    }'::jsonb,
    18.50,
    1.48,
    19.98
);
*/

-- Query to get customer order history
-- SELECT * FROM sales_orders WHERE customer_id = 'user123' ORDER BY order_date DESC;

-- Query to get order details
-- SELECT order_id, customer_id, order_date, order_details, total 
-- FROM sales_orders 
-- WHERE order_id = 1;
