import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// Get sales by date range
router.get('/sales', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let queryText;
    let params;

    if (startDate && endDate) {
      queryText = `
        SELECT DATE(sale_date) as date, COUNT(*) as count, SUM(price) as total
        FROM sales
        WHERE DATE(sale_date) BETWEEN $1 AND $2
        GROUP BY DATE(sale_date)
        ORDER BY date
      `;
      params = [startDate, endDate];
    } else {
      queryText = `
        SELECT DATE(sale_date) as date, COUNT(*) as count, SUM(price) as total
        FROM sales
        WHERE DATE(sale_date) >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE(sale_date)
        ORDER BY date
      `;
      params = [];
    }

    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sales analytics:', error);
    res.status(500).json({ error: 'Failed to fetch sales analytics' });
  }
});

// Get hourly sales for X-Report (specific date)
router.get('/xreport', async (req, res) => {
  try {
    const { date } = req.query;
    const reportDate = date || new Date().toISOString().split('T')[0];

    const result = await query(
      `SELECT
        EXTRACT(HOUR FROM sale_date) as hour,
        COUNT(*) as transaction_count,
        SUM(price) as total_sales
      FROM sales
      WHERE DATE(sale_date) = $1
      GROUP BY EXTRACT(HOUR FROM sale_date)
      ORDER BY hour`,
      [reportDate]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching X-Report:', error);
    res.status(500).json({ error: 'Failed to fetch X-Report data' });
  }
});

// Get Z-Report (employee sales for specific date)
router.get('/zreport', async (req, res) => {
  try {
    const { date } = req.query;
    const reportDate = date || new Date().toISOString().split('T')[0];

    const result = await query(
      `SELECT
        employeeid,
        COUNT(*) as sales_count,
        SUM(price) as total_sales
      FROM sales
      WHERE DATE(sale_date) = $1
      GROUP BY employeeid
      ORDER BY employeeid`,
      [reportDate]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching Z-Report:', error);
    res.status(500).json({ error: 'Failed to fetch Z-Report data' });
  }
});

// Get sales trends (revenue, volume, avg price)
router.get('/trends', async (req, res) => {
  try {
    const { metric, startDate, endDate } = req.query;
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];

    let metricQuery;
    switch (metric) {
      case 'volume':
        metricQuery = 'COUNT(*) as value';
        break;
      case 'average':
        metricQuery = 'AVG(price) as value';
        break;
      case 'revenue':
      default:
        metricQuery = 'SUM(price) as value';
        break;
    }

    const result = await query(
      `SELECT DATE(sale_date) as date, ${metricQuery}
      FROM sales
      WHERE DATE(sale_date) BETWEEN $1 AND $2
      GROUP BY DATE(sale_date)
      ORDER BY date`,
      [start, end]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ error: 'Failed to fetch trends data' });
  }
});

export default router;
