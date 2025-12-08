-- Z Report Query
-- Usage: Replace '2025-12-05' with the desired date.

SELECT json_build_object(
    'date', '2025-12-05',
    'summary', (
        SELECT json_build_object(
            'total_sales', COALESCE(SUM(total), 0),
            'total_tax', COALESCE(SUM(tax), 0),
            'net_sales', COALESCE(SUM(subtotal), 0),
            'transaction_count', COUNT(*)
        )
        FROM sales_orders 
        WHERE DATE(order_date) = '2025-12-05'
    ),
    'payment_breakdown', (
        SELECT json_agg(t) FROM (
            SELECT payment_method, SUM(total) as amount, COUNT(*) as count 
            FROM sales_orders 
            WHERE DATE(order_date) = '2025-12-05' 
            GROUP BY payment_method
        ) t
    )
) as z_report;

-- Example: Creating a Stored Function
/*
CREATE OR REPLACE FUNCTION get_z_report(report_date DATE)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'date', report_date,
        'summary', (
            SELECT json_build_object(
                'total_sales', COALESCE(SUM(total), 0),
                'total_tax', COALESCE(SUM(tax), 0),
                'net_sales', COALESCE(SUM(subtotal), 0),
                'transaction_count', COUNT(*)
            )
            FROM sales_orders 
            WHERE DATE(order_date) = report_date
        ),
        'payment_breakdown', (
            SELECT json_agg(t) FROM (
                SELECT payment_method, SUM(total) as amount, COUNT(*) as count 
                FROM sales_orders 
                WHERE DATE(order_date) = report_date 
                GROUP BY payment_method
            ) t
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;
*/
