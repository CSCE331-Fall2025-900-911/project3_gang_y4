import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// Get all sales (with optional limit)
router.get('/', async (req, res) => {
  try {
    const { limit = 100 } = req.query;

    const result = await query(
      `SELECT salesid, custid, employeeid, sale_date, price
       FROM sales
       ORDER BY sale_date DESC
       LIMIT $1`,
      [limit]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
});

// Get sales by date range
router.get('/range', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const result = await query(
      `SELECT salesid, custid, employeeid, sale_date, price
       FROM sales
       WHERE DATE(sale_date) BETWEEN $1 AND $2
       ORDER BY sale_date DESC`,
      [startDate, endDate]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sales by range:', error);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
});

// Get single sale by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT salesid, custid, employeeid, sale_date, price FROM sales WHERE salesid = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching sale:', error);
    res.status(500).json({ error: 'Failed to fetch sale' });
  }
});

export default router;
