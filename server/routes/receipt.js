import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// Parameterized SQL: username supplied as $1
const ORDER_SUMMARY_SQL = `
SELECT 
    s.salesid as order_id,
    TO_CHAR(s.sale_date, 'MM/DD/YYYY HH12:MI AM') as date_time,
    STRING_AGG(
        m.menu_name || ' x' || ips.quantity || ' @ $' || m.price || ' = $' || (ips.quantity * m.price),
        E'\n        '
    ) as items,
    '$' || s.price as order_total
FROM sales s
JOIN customers c ON s.custid = c.customerid
JOIN items_per_sales ips ON s.salesid = ips.saleid
JOIN menu m ON ips.itemid = m.menuid
WHERE c.username = $1
GROUP BY s.salesid, s.sale_date, s.price
ORDER BY s.sale_date DESC;`;

// GET /api/receipt/:username
// Returns JSON with the orders for the given username
router.get('/:username', async (req, res, next) => {
  try {
    const { username } = req.params;
    if (!username) return res.status(400).json({ error: 'username is required' });

    const result = await query(ORDER_SUMMARY_SQL, [username]);

    // Normalize rows for JSON output
    const orders = result.rows.map((r) => ({
      orderId: r.order_id,
      dateTime: r.date_time,
      // split items into array by newline and trim whitespace
      items: r.items ? r.items.split('\n').map((s) => s.trim()).filter(Boolean) : [],
      orderTotal: r.order_total,
    }));

    res.json({ username, orders });
  } catch (error) {
    next(error);
  }
});

export default router;
