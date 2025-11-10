import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// Submit a new order
router.post('/', async (req, res) => {
  try {
    const { customer_id = 'guest', items, subtotal, tax, total, payment_method = 'cash' } = req.body;
    
    // Validate request
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }
    
    if (!subtotal || !tax || !total) {
      return res.status(400).json({ error: 'Subtotal, tax, and total are required' });
    }
    
    // Structure the order details as JSONB
    const orderDetails = {
      items: items.map(item => ({
        menu_id: item.id,
        name: item.name,
        base_price: item.price,
        quantity: item.quantity,
        customizations: item.customizations || [],
        item_total: item.itemTotal
      })),
      order_notes: req.body.notes || ''
    };
    
    // Insert order into database
    const result = await query(
      `INSERT INTO sales_orders 
       (customer_id, order_details, subtotal, tax, total, payment_method) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING order_id, order_date`,
      [customer_id, JSON.stringify(orderDetails), subtotal, tax, total, payment_method]
    );
    
    const order = result.rows[0];
    
    res.status(201).json({
      success: true,
      order_id: order.order_id,
      order_date: order.order_date,
      message: 'Order placed successfully'
    });
    
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get order by ID
router.get('/:order_id', async (req, res) => {
  try {
    const { order_id } = req.params;
    
    const result = await query(
      `SELECT order_id, customer_id, order_date, order_details, 
              subtotal, tax, total, payment_method, order_status
       FROM sales_orders 
       WHERE order_id = $1`,
      [order_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Get customer order history
router.get('/customer/:customer_id', async (req, res) => {
  try {
    const { customer_id } = req.params;
    const limit = req.query.limit || 50;
    
    const result = await query(
      `SELECT order_id, customer_id, order_date, order_details, 
              subtotal, tax, total, payment_method, order_status
       FROM sales_orders 
       WHERE customer_id = $1 
       ORDER BY order_date DESC 
       LIMIT $2`,
      [customer_id, limit]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({ error: 'Failed to fetch order history' });
  }
});

export default router;
