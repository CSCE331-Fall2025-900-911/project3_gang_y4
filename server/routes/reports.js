import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// X Report - Mid-shift sales summary (does not reset counters)
router.get('/x', async (req, res) => {
  try {
    const { date, startTime, endTime } = req.query;

    if (!date || !startTime || !endTime) {
      return res.status(400).json({ error: 'date, startTime, and endTime are required' });
    }

    // Let PostgreSQL handle timezone conversion using 'America/Chicago'
    // This automatically accounts for CST/CDT (Daylight Saving Time)
    console.log(`📊 Generating X Report for ${date} ${startTime}:00 to ${endTime}:59 CST`);

    // 1. Sales Summary
    const salesSummary = await query(
      `SELECT
        COUNT(*) as total_orders,
        SUM(total) as net_sales,
        SUM(subtotal) as gross_sales,
        SUM(tax) as total_tax
      FROM sales_orders
      WHERE order_date::date = $1::date
        AND order_date::time >= $2::time
        AND order_date::time <= ($3 || ':59')::time`,
      [date, startTime, endTime]
    );

    // 2. Total items sold (sum all item quantities from order_details JSON)
    const itemsCount = await query(
      `SELECT
        COALESCE(SUM((item->>'quantity')::int), 0) as total_items
      FROM sales_orders,
      jsonb_array_elements(order_details->'items') AS item
      WHERE order_date::date = $1::date
        AND order_date::time >= $2::time
        AND order_date::time <= ($3 || ':59')::time`,
      [date, startTime, endTime]
    );

    // 3. Payment Methods
    const paymentMethods = await query(
      `SELECT
        payment_method,
        COUNT(*) as count,
        SUM(total) as amount
      FROM sales_orders
      WHERE order_date::date = $1::date
        AND order_date::time >= $2::time
        AND order_date::time <= ($3 || ':59')::time
      GROUP BY payment_method
      ORDER BY payment_method`,
      [date, startTime, endTime]
    );

    // 4. Top Selling Items (Top 10)
    const topItems = await query(
      `SELECT
        item->>'name' as item_name,
        SUM((item->>'quantity')::int) as quantity,
        SUM((item->>'item_total')::numeric) as revenue
      FROM sales_orders,
      jsonb_array_elements(order_details->'items') AS item
      WHERE order_date::date = $1::date
        AND order_date::time >= $2::time
        AND order_date::time <= ($3 || ':59')::time
      GROUP BY item->>'name'
      ORDER BY quantity DESC
      LIMIT 10`,
      [date, startTime, endTime]
    );

    // 5. Sales by Employee
    const salesByEmployee = await query(
      `SELECT
        CASE
          WHEN so.employee_id = 0 THEN 'Self-Service Kiosk'
          ELSE COALESCE(e.username, 'Unknown')
        END as employee,
        COUNT(*) as orders,
        SUM(so.total) as sales
      FROM sales_orders so
      LEFT JOIN employees e ON so.employee_id = e.employeeid
      WHERE so.order_date::date = $1::date
        AND so.order_date::time >= $2::time
        AND so.order_date::time <= ($3 || ':59')::time
      GROUP BY so.employee_id, e.username
      ORDER BY sales DESC`,
      [date, startTime, endTime]
    );

    // 6. Sales by Hour (if same-day report)
    const salesByHour = await query(
      `SELECT
        EXTRACT(HOUR FROM order_date) as hour,
        COUNT(*) as orders,
        SUM(total) as revenue
      FROM sales_orders
      WHERE order_date::date = $1::date
        AND order_date::time >= $2::time
        AND order_date::time <= ($3 || ':59')::time
      GROUP BY hour
      ORDER BY hour`,
      [date, startTime, endTime]
    );

    // 7. Customer Statistics
    const customerStats = await query(
      `SELECT
        COUNT(CASE
          WHEN customer_id::text IN ('0', 'Guest') THEN 1
        END) as guest_orders,
        COUNT(CASE
          WHEN customer_id::text NOT IN ('0', 'Guest') THEN 1
        END) as registered_orders,
        COALESCE(SUM(
          CASE
            WHEN customer_id::text NOT IN ('0', 'Guest')
            THEN (total * 100)::int
            ELSE 0
          END
        ), 0) as total_rewards
      FROM sales_orders
      WHERE order_date::date = $1::date
        AND order_date::time >= $2::time
        AND order_date::time <= ($3 || ':59')::time`,
      [date, startTime, endTime]
    );

    // Build the response
    const summary = salesSummary.rows[0] || {};
    const stats = customerStats.rows[0] || {};

    res.json({
      report_type: 'X Report',
      generated_at: new Date().toISOString(),
      period: {
        start: `${date} ${startTime}:00`,
        end: `${date} ${endTime}:59`
      },
      sales_summary: {
        total_orders: parseInt(summary.total_orders) || 0,
        total_items_sold: parseInt(itemsCount.rows[0]?.total_items) || 0,
        gross_sales: parseFloat(summary.gross_sales) || 0,
        sales_tax: parseFloat(summary.total_tax) || 0,
        net_sales: parseFloat(summary.net_sales) || 0
      },
      payment_methods: paymentMethods.rows.map(pm => ({
        method: pm.payment_method,
        count: parseInt(pm.count),
        amount: parseFloat(pm.amount)
      })),
      top_items: topItems.rows.map(item => ({
        item_name: item.item_name,
        quantity: parseInt(item.quantity),
        revenue: parseFloat(item.revenue)
      })),
      sales_by_employee: salesByEmployee.rows.map(emp => ({
        employee: emp.employee,
        orders: parseInt(emp.orders),
        sales: parseFloat(emp.sales)
      })),
      sales_by_hour: salesByHour.rows.map(hour => ({
        hour: parseInt(hour.hour),
        orders: parseInt(hour.orders),
        revenue: parseFloat(hour.revenue)
      })),
      customer_statistics: {
        guest_orders: parseInt(stats.guest_orders) || 0,
        registered_orders: parseInt(stats.registered_orders) || 0,
        rewards_points_earned: parseInt(stats.total_rewards) || 0
      }
    });

  } catch (error) {
    console.error('Error generating X Report:', error);
    res.status(500).json({ error: 'Failed to generate X Report', details: error.message });
  }
});

export default router;
