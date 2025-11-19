import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// Helper function to determine time granularity based on date range
function getGranularity(fromDate, toDate) {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  const daysDiff = Math.ceil((to - from) / (1000 * 60 * 60 * 24));

  if (daysDiff <= 1) return 'hour';
  if (daysDiff <= 30) return 'day';
  if (daysDiff <= 90) return 'week';
  return 'month';
}

// Helper function to parse order_details JSONB and sum quantities
function getItemQuantitySql() {
  return `
    COALESCE((
      SELECT SUM((item->>'quantity')::int)
      FROM jsonb_array_elements(order_details->'items') AS item
    ), 0)
  `;
}

// GET /api/analytics/sales - Main analytics endpoint
router.get('/sales', async (req, res) => {
  try {
    const {
      from,
      to,
      metric = 'revenue',
      employeeId
    } = req.query;

    console.log('📊 Analytics request:', { from, to, metric, employeeId });

    // Set default date range if not provided
    const toDate = to || new Date().toISOString().split('T')[0];
    const fromDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Determine time granularity
    const granularity = getGranularity(fromDate, toDate);

    console.log('   Date range:', fromDate, 'to', toDate);
    console.log('   Granularity:', granularity);

    let sqlQuery;
    let params;
    let employeeFilter;

    // Metrics that don't use dynamic granularity (always aggregate across full date range)
    const nonGranularityMetrics = ['items', 'payment', 'hourly', 'customers'];

    // Set up params and employee filter based on metric type and granularity
    if (nonGranularityMetrics.includes(metric)) {
      // These metrics always use 2 date params regardless of date range
      params = [fromDate, toDate];
      employeeFilter = employeeId ? `AND employee_id::INTEGER = $3` : '';
      if (employeeId) {
        params.push(parseInt(employeeId));
      }
    } else if (granularity === 'hour') {
      // For hourly granularity (1 day), we only need 1 date param
      params = [fromDate];
      employeeFilter = employeeId ? `AND employee_id::INTEGER = $2` : '';
      if (employeeId) {
        params.push(parseInt(employeeId));
      }
    } else {
      // For other granularities, we need from and to dates
      params = [fromDate, toDate];
      employeeFilter = employeeId ? `AND employee_id::INTEGER = $3` : '';
      if (employeeId) {
        params.push(parseInt(employeeId));
      }
    }

    // Build query based on metric and granularity
    switch (metric) {
      case 'volume': {
        // Total quantity of items sold
        if (granularity === 'hour') {
          sqlQuery = `
            SELECT
              EXTRACT(HOUR FROM order_date AT TIME ZONE 'America/Chicago') as period,
              SUM(${getItemQuantitySql()}) as value
            FROM sales_orders
            WHERE DATE(order_date AT TIME ZONE 'America/Chicago') = $1
              ${employeeFilter}
            GROUP BY EXTRACT(HOUR FROM order_date AT TIME ZONE 'America/Chicago')
            ORDER BY period
          `;
        } else if (granularity === 'day') {
          sqlQuery = `
            SELECT
              TO_CHAR(order_date AT TIME ZONE 'America/Chicago', 'YYYY-MM-DD') as period,
              SUM(${getItemQuantitySql()}) as value
            FROM sales_orders
            WHERE order_date AT TIME ZONE 'America/Chicago' >= $1::date
              AND order_date AT TIME ZONE 'America/Chicago' < $2::date + interval '1 day'
              ${employeeFilter}
            GROUP BY TO_CHAR(order_date AT TIME ZONE 'America/Chicago', 'YYYY-MM-DD')
            ORDER BY period
          `;
        } else if (granularity === 'week') {
          sqlQuery = `
            SELECT
              TO_CHAR(DATE_TRUNC('week', order_date AT TIME ZONE 'America/Chicago'), 'YYYY-MM-DD') as period,
              SUM(${getItemQuantitySql()}) as value
            FROM sales_orders
            WHERE order_date AT TIME ZONE 'America/Chicago' >= $1::date
              AND order_date AT TIME ZONE 'America/Chicago' < $2::date + interval '1 day'
              ${employeeFilter}
            GROUP BY DATE_TRUNC('week', order_date AT TIME ZONE 'America/Chicago')
            ORDER BY period
          `;
        } else { // month
          sqlQuery = `
            SELECT
              TO_CHAR(DATE_TRUNC('month', order_date AT TIME ZONE 'America/Chicago'), 'YYYY-MM') as period,
              SUM(${getItemQuantitySql()}) as value
            FROM sales_orders
            WHERE order_date AT TIME ZONE 'America/Chicago' >= $1::date
              AND order_date AT TIME ZONE 'America/Chicago' < $2::date + interval '1 day'
              ${employeeFilter}
            GROUP BY DATE_TRUNC('month', order_date AT TIME ZONE 'America/Chicago')
            ORDER BY period
          `;
        }
        break;
      }

      case 'revenue': {
        // Total dollar amount of sales
        if (granularity === 'hour') {
          sqlQuery = `
            SELECT
              EXTRACT(HOUR FROM order_date AT TIME ZONE 'America/Chicago') as period,
              COALESCE(SUM(total), 0) as value
            FROM sales_orders
            WHERE DATE(order_date AT TIME ZONE 'America/Chicago') = $1
              ${employeeFilter}
            GROUP BY EXTRACT(HOUR FROM order_date AT TIME ZONE 'America/Chicago')
            ORDER BY period
          `;
        } else if (granularity === 'day') {
          sqlQuery = `
            SELECT
              TO_CHAR(order_date AT TIME ZONE 'America/Chicago', 'YYYY-MM-DD') as period,
              COALESCE(SUM(total), 0) as value
            FROM sales_orders
            WHERE order_date AT TIME ZONE 'America/Chicago' >= $1::date
              AND order_date AT TIME ZONE 'America/Chicago' < $2::date + interval '1 day'
              ${employeeFilter}
            GROUP BY TO_CHAR(order_date AT TIME ZONE 'America/Chicago', 'YYYY-MM-DD')
            ORDER BY period
          `;
        } else if (granularity === 'week') {
          sqlQuery = `
            SELECT
              TO_CHAR(DATE_TRUNC('week', order_date AT TIME ZONE 'America/Chicago'), 'YYYY-MM-DD') as period,
              COALESCE(SUM(total), 0) as value
            FROM sales_orders
            WHERE order_date AT TIME ZONE 'America/Chicago' >= $1::date
              AND order_date AT TIME ZONE 'America/Chicago' < $2::date + interval '1 day'
              ${employeeFilter}
            GROUP BY DATE_TRUNC('week', order_date AT TIME ZONE 'America/Chicago')
            ORDER BY period
          `;
        } else { // month
          sqlQuery = `
            SELECT
              TO_CHAR(DATE_TRUNC('month', order_date AT TIME ZONE 'America/Chicago'), 'YYYY-MM') as period,
              COALESCE(SUM(total), 0) as value
            FROM sales_orders
            WHERE order_date AT TIME ZONE 'America/Chicago' >= $1::date
              AND order_date AT TIME ZONE 'America/Chicago' < $2::date + interval '1 day'
              ${employeeFilter}
            GROUP BY DATE_TRUNC('month', order_date AT TIME ZONE 'America/Chicago')
            ORDER BY period
          `;
        }
        break;
      }

      case 'orders': {
        // Number of orders/sales
        if (granularity === 'hour') {
          sqlQuery = `
            SELECT
              EXTRACT(HOUR FROM order_date AT TIME ZONE 'America/Chicago') as period,
              COUNT(*) as value
            FROM sales_orders
            WHERE DATE(order_date AT TIME ZONE 'America/Chicago') = $1
              ${employeeFilter}
            GROUP BY EXTRACT(HOUR FROM order_date AT TIME ZONE 'America/Chicago')
            ORDER BY period
          `;
        } else if (granularity === 'day') {
          sqlQuery = `
            SELECT
              TO_CHAR(order_date AT TIME ZONE 'America/Chicago', 'YYYY-MM-DD') as period,
              COUNT(*) as value
            FROM sales_orders
            WHERE order_date AT TIME ZONE 'America/Chicago' >= $1::date
              AND order_date AT TIME ZONE 'America/Chicago' < $2::date + interval '1 day'
              ${employeeFilter}
            GROUP BY TO_CHAR(order_date AT TIME ZONE 'America/Chicago', 'YYYY-MM-DD')
            ORDER BY period
          `;
        } else if (granularity === 'week') {
          sqlQuery = `
            SELECT
              TO_CHAR(DATE_TRUNC('week', order_date AT TIME ZONE 'America/Chicago'), 'YYYY-MM-DD') as period,
              COUNT(*) as value
            FROM sales_orders
            WHERE order_date AT TIME ZONE 'America/Chicago' >= $1::date
              AND order_date AT TIME ZONE 'America/Chicago' < $2::date + interval '1 day'
              ${employeeFilter}
            GROUP BY DATE_TRUNC('week', order_date AT TIME ZONE 'America/Chicago')
            ORDER BY period
          `;
        } else { // month
          sqlQuery = `
            SELECT
              TO_CHAR(DATE_TRUNC('month', order_date AT TIME ZONE 'America/Chicago'), 'YYYY-MM') as period,
              COUNT(*) as value
            FROM sales_orders
            WHERE order_date AT TIME ZONE 'America/Chicago' >= $1::date
              AND order_date AT TIME ZONE 'America/Chicago' < $2::date + interval '1 day'
              ${employeeFilter}
            GROUP BY DATE_TRUNC('month', order_date AT TIME ZONE 'America/Chicago')
            ORDER BY period
          `;
        }
        break;
      }

      case 'avgOrder': {
        // Average order value
        if (granularity === 'hour') {
          sqlQuery = `
            SELECT
              EXTRACT(HOUR FROM order_date AT TIME ZONE 'America/Chicago') as period,
              COALESCE(AVG(total), 0) as value
            FROM sales_orders
            WHERE DATE(order_date AT TIME ZONE 'America/Chicago') = $1
              ${employeeFilter}
            GROUP BY EXTRACT(HOUR FROM order_date AT TIME ZONE 'America/Chicago')
            ORDER BY period
          `;
        } else if (granularity === 'day') {
          sqlQuery = `
            SELECT
              TO_CHAR(order_date AT TIME ZONE 'America/Chicago', 'YYYY-MM-DD') as period,
              COALESCE(AVG(total), 0) as value
            FROM sales_orders
            WHERE order_date AT TIME ZONE 'America/Chicago' >= $1::date
              AND order_date AT TIME ZONE 'America/Chicago' < $2::date + interval '1 day'
              ${employeeFilter}
            GROUP BY TO_CHAR(order_date AT TIME ZONE 'America/Chicago', 'YYYY-MM-DD')
            ORDER BY period
          `;
        } else if (granularity === 'week') {
          sqlQuery = `
            SELECT
              TO_CHAR(DATE_TRUNC('week', order_date AT TIME ZONE 'America/Chicago'), 'YYYY-MM-DD') as period,
              COALESCE(AVG(total), 0) as value
            FROM sales_orders
            WHERE order_date AT TIME ZONE 'America/Chicago' >= $1::date
              AND order_date AT TIME ZONE 'America/Chicago' < $2::date + interval '1 day'
              ${employeeFilter}
            GROUP BY DATE_TRUNC('week', order_date AT TIME ZONE 'America/Chicago')
            ORDER BY period
          `;
        } else { // month
          sqlQuery = `
            SELECT
              TO_CHAR(DATE_TRUNC('month', order_date AT TIME ZONE 'America/Chicago'), 'YYYY-MM') as period,
              COALESCE(AVG(total), 0) as value
            FROM sales_orders
            WHERE order_date AT TIME ZONE 'America/Chicago' >= $1::date
              AND order_date AT TIME ZONE 'America/Chicago' < $2::date + interval '1 day'
              ${employeeFilter}
            GROUP BY DATE_TRUNC('month', order_date AT TIME ZONE 'America/Chicago')
            ORDER BY period
          `;
        }
        break;
      }

      case 'items': {
        // Popular menu items - top 10
        sqlQuery = `
          SELECT
            item->>'name' as period,
            SUM((item->>'quantity')::int) as value
          FROM sales_orders,
          jsonb_array_elements(order_details->'items') AS item
          WHERE order_date AT TIME ZONE 'America/Chicago' >= $1::date
            AND order_date AT TIME ZONE 'America/Chicago' < $2::date + interval '1 day'
            ${employeeFilter}
          GROUP BY item->>'name'
          ORDER BY value DESC
          LIMIT 10
        `;
        break;
      }

      case 'payment': {
        // Sales by payment method
        sqlQuery = `
          SELECT
            COALESCE(payment_method, 'Unknown') as period,
            COUNT(*) as count,
            SUM(total) as value
          FROM sales_orders
          WHERE order_date AT TIME ZONE 'America/Chicago' >= $1::date
            AND order_date AT TIME ZONE 'America/Chicago' < $2::date + interval '1 day'
            ${employeeFilter}
          GROUP BY payment_method
          ORDER BY value DESC
        `;
        break;
      }

      case 'hourly': {
        // Sales by hour of day (aggregated across all days in range)
        sqlQuery = `
          SELECT
            EXTRACT(HOUR FROM order_date AT TIME ZONE 'America/Chicago') as period,
            COUNT(*) as count,
            SUM(total) as value
          FROM sales_orders
          WHERE order_date AT TIME ZONE 'America/Chicago' >= $1::date
            AND order_date AT TIME ZONE 'America/Chicago' < $2::date + interval '1 day'
            ${employeeFilter}
          GROUP BY EXTRACT(HOUR FROM order_date AT TIME ZONE 'America/Chicago')
          ORDER BY period
        `;
        break;
      }

      case 'customers': {
        // Customer type breakdown
        sqlQuery = `
          SELECT
            CASE
              WHEN customer_id = '0' OR customer_id = 'guest' THEN 'Guest'
              ELSE 'Registered'
            END as period,
            COUNT(*) as count,
            SUM(total) as value
          FROM sales_orders
          WHERE order_date AT TIME ZONE 'America/Chicago' >= $1::date
            AND order_date AT TIME ZONE 'America/Chicago' < $2::date + interval '1 day'
            ${employeeFilter}
          GROUP BY CASE
            WHEN customer_id = '0' OR customer_id = 'guest' THEN 'Guest'
            ELSE 'Registered'
          END
          ORDER BY value DESC
        `;
        break;
      }

      default:
        return res.status(400).json({ error: 'Invalid metric type' });
    }

    console.log('   Executing query...');
    const result = await query(sqlQuery, params);
    console.log(`   ✅ Returned ${result.rows.length} data points`);

    // Format response
    const response = {
      metric,
      dateRange: { from: fromDate, to: toDate },
      granularity,
      employeeId: employeeId || null,
      data: result.rows.map(row => ({
        period: String(row.period),
        value: parseFloat(row.value) || 0,
        count: row.count ? parseInt(row.count) : undefined
      }))
    };

    res.json(response);

  } catch (error) {
    console.error('❌ Error fetching analytics:', error);
    console.error('   Error message:', error.message);
    console.error('   Error stack:', error.stack);
    res.status(500).json({
      error: 'Failed to fetch analytics data',
      details: error.message
    });
  }
});

// GET /api/analytics/employees - Get list of employees for filtering
router.get('/employees', async (req, res) => {
  try {
    const result = await query(
      `SELECT DISTINCT
        e.employeeid,
        e.username,
        e.first_name,
        e.last_name,
        CONCAT(e.first_name, ' ', e.last_name, ' (', e.username, ')') as display_name
      FROM employees e
      WHERE e.employeeid IN (
        SELECT DISTINCT employee_id::INTEGER
        FROM sales_orders
        WHERE employee_id IS NOT NULL
          AND employee_id != '0'
          AND employee_id ~ '^[0-9]+$'
      )
      ORDER BY e.first_name, e.last_name`
    );

    // Add self-service kiosk option
    const employees = [
      {
        employeeid: 0,
        username: 'kiosk',
        first_name: 'Self-Service',
        last_name: 'Kiosk',
        display_name: 'Self-Service Kiosk'
      },
      ...result.rows
    ];

    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

export default router;
