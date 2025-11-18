import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// Submit a new order
router.post('/', async (req, res) => {
  try {
    console.log('📦 Order received:', JSON.stringify(req.body, null, 2));

    const {
      customer_id = 'guest',
      order_details,
      subtotal,
      tax,
      total,
      payment_method = 'cash',
      employee_id
    } = req.body;

    // Extract items from order_details if provided, otherwise look for items at top level
    const items = order_details?.items || req.body.items;

    // Validate request
    if (!items || items.length === 0) {
      console.error('❌ Validation failed: No items in order');
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    if (!subtotal || !tax || !total) {
      console.error('❌ Validation failed: Missing subtotal, tax, or total');
      return res.status(400).json({
        error: 'Subtotal, tax, and total are required',
        received: { subtotal, tax, total }
      });
    }

    // Structure the order details as JSONB
    const transactionTime = new Date().toISOString();
    const orderDetailsJson = {
      items: items.map(item => ({
        menu_id: item.menu_id || item.id,
        name: item.name,
        base_price: item.base_price || item.price,
        quantity: item.quantity || 1,
        customizations: item.customizations || [],
        item_total: item.item_total || item.totalPrice
      })),
      order_notes: order_details?.order_notes || req.body.notes || '',
      transaction_time: transactionTime
    };

    console.log('💾 Inserting order into database...');
    console.log('   Customer ID:', customer_id);
    console.log('   Employee ID:', employee_id != null ? employee_id : 'N/A');
    console.log('   Total:', total);

    // Insert order into database with employee_id support
    // Check for null/undefined explicitly since employee_id can be 0 (self-service kiosk)
    const insertQuery = employee_id != null
      ? `INSERT INTO sales_orders
         (customer_id, employee_id, order_details, subtotal, tax, total, payment_method)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING order_id, order_date`
      : `INSERT INTO sales_orders
         (customer_id, order_details, subtotal, tax, total, payment_method)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING order_id, order_date`;

    const queryParams = employee_id != null
      ? [customer_id, employee_id, JSON.stringify(orderDetailsJson), subtotal, tax, total, payment_method]
      : [customer_id, JSON.stringify(orderDetailsJson), subtotal, tax, total, payment_method];

    const result = await query(insertQuery, queryParams);

    const order = result.rows[0];

    console.log('✅ Order created successfully:', order.order_id);

    res.status(201).json({
      success: true,
      order_id: order.order_id,
      order_date: order.order_date,
      message: 'Order placed successfully'
    });

  } catch (error) {
    console.error('❌ Error creating order:', error);
    console.error('   Error name:', error.name);
    console.error('   Error message:', error.message);
    console.error('   Error stack:', error.stack);

    // Return more detailed error in development
    res.status(500).json({
      error: 'Failed to create order',
      details: error.message,
      code: error.code
    });
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
