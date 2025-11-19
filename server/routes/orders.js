import express from 'express';
import pool, { query } from '../db.js';

const router = express.Router();

// Submit a new order
router.post('/', async (req, res) => {
  let client;

  try {
    console.log('📦 Order received:', JSON.stringify(req.body, null, 2));

    // Get database client for transaction
    client = await pool.connect();

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
    // Get current time in CST (Central Standard Time / America/Chicago)
    const now = new Date();
    const transactionTime = now.toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

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

    console.log('💾 Processing order with inventory tracking...');
    console.log('   Customer ID:', customer_id);
    console.log('   Employee ID:', employee_id != null ? employee_id : 'N/A');
    console.log('   Total:', total);

    // Collect all menu IDs from order (items + customizations)
    const menuIds = [];
    const menuQuantities = {};

    for (const item of orderDetailsJson.items) {
      const menuId = item.menu_id;
      const quantity = item.quantity || 1;

      menuIds.push(menuId);
      menuQuantities[menuId] = (menuQuantities[menuId] || 0) + quantity;

      // Include customizations that are menu items
      if (item.customizations && item.customizations.length > 0) {
        for (const custom of item.customizations) {
          if (custom.id || custom.menu_id) {
            const customMenuId = custom.id || custom.menu_id;
            menuIds.push(customMenuId);
            menuQuantities[customMenuId] = (menuQuantities[customMenuId] || 0) + quantity;
          }
        }
      }
    }

    console.log('   Menu items to process:', menuIds);
    console.log('   Menu quantities:', menuQuantities);

    // BEGIN TRANSACTION
    await client.query('BEGIN');

    // Check inventory availability (optional - gracefully handle if table doesn't exist)
    let ingredientNeeds = {};
    let inventoryTrackingEnabled = false;

    try {
      const inventoryCheckQuery = `
        SELECT
          i.ingredientid,
          i.item_name,
          i.quantity as current_stock,
          mi.menuid,
          mi.quantity as unit_required,
          $1::jsonb as menu_quantities
        FROM menuinventory mi
        JOIN inventory i ON mi.inventoryid = i.ingredientid
        WHERE mi.menuid = ANY($2::int[])
        FOR UPDATE OF i
      `;

      const inventoryCheck = await client.query(inventoryCheckQuery, [
        JSON.stringify(menuQuantities),
        menuIds
      ]);

      console.log(`   Found ${inventoryCheck.rows.length} inventory mappings`);

      if (inventoryCheck.rows.length > 0) {
        inventoryTrackingEnabled = true;

        // Calculate total needed for each ingredient
        for (const row of inventoryCheck.rows) {
          const menuQty = menuQuantities[row.menuid] || 0;
          const totalNeeded = row.unit_required * menuQty;

          if (!ingredientNeeds[row.ingredientid]) {
            ingredientNeeds[row.ingredientid] = {
              name: row.item_name,
              current: row.current_stock,
              needed: 0
            };
          }

          ingredientNeeds[row.ingredientid].needed += totalNeeded;
        }

        console.log('   Ingredient requirements:', ingredientNeeds);

        // Check for insufficient stock
        const insufficientItems = [];
        for (const [ingredientId, info] of Object.entries(ingredientNeeds)) {
          if (info.current < info.needed) {
            insufficientItems.push({
              item: info.name,
              available: info.current,
              needed: info.needed
            });
          }
        }

        if (insufficientItems.length > 0) {
          await client.query('ROLLBACK');
          console.error('❌ Insufficient inventory:', insufficientItems);
          return res.status(400).json({
            error: 'Insufficient inventory',
            details: 'One or more items are out of stock',
            insufficientItems: insufficientItems
          });
        }
      } else {
        console.log('   ⚠️  No inventory mappings found - inventory tracking disabled for this order');
      }
    } catch (inventoryError) {
      // Inventory tracking failed (table doesn't exist, etc.) - allow order to proceed
      console.warn('   ⚠️  Inventory tracking unavailable:', inventoryError.message);
      console.warn('   Proceeding with order without inventory validation');
      inventoryTrackingEnabled = false;
      ingredientNeeds = {};
    }

    // Create the order with CST timestamp
    const insertQuery = employee_id != null
      ? `INSERT INTO sales_orders
         (customer_id, employee_id, order_details, subtotal, tax, total, payment_method, order_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, (NOW() AT TIME ZONE 'America/Chicago'))
         RETURNING order_id, order_date`
      : `INSERT INTO sales_orders
         (customer_id, order_details, subtotal, tax, total, payment_method, order_date)
         VALUES ($1, $2, $3, $4, $5, $6, (NOW() AT TIME ZONE 'America/Chicago'))
         RETURNING order_id, order_date`;

    const queryParams = employee_id != null
      ? [customer_id, employee_id, JSON.stringify(orderDetailsJson), subtotal, tax, total, payment_method]
      : [customer_id, JSON.stringify(orderDetailsJson), subtotal, tax, total, payment_method];

    const result = await client.query(insertQuery, queryParams);
    const order = result.rows[0];

    console.log(`   ✅ Order ${order.order_id} created`);

    // Decrement inventory for each ingredient (if inventory tracking is enabled)
    if (inventoryTrackingEnabled && Object.keys(ingredientNeeds).length > 0) {
      for (const [ingredientId, info] of Object.entries(ingredientNeeds)) {
        const updateQuery = `
          UPDATE inventory
          SET quantity = quantity - $1
          WHERE ingredientid = $2
        `;

        await client.query(updateQuery, [info.needed, parseInt(ingredientId)]);
        console.log(`   📦 Decremented ${info.name}: -${info.needed} (new stock: ${info.current - info.needed})`);
      }

      // TODO: Add transaction logging after creating inventory_transactions table
      // To enable: Run server/migrations/create_inventory_transactions.sql
      console.log(`   📝 Transaction logging skipped (table not created yet)`);
    }

    // COMMIT TRANSACTION
    await client.query('COMMIT');

    const inventoryStatus = inventoryTrackingEnabled && Object.keys(ingredientNeeds).length > 0
      ? 'with inventory updated'
      : 'without inventory tracking';
    console.log(`✅ Order completed ${inventoryStatus}`);

    res.status(201).json({
      success: true,
      order_id: order.order_id,
      order_date: order.order_date,
      message: 'Order placed successfully',
      inventory_updated: inventoryTrackingEnabled && Object.keys(ingredientNeeds).length > 0
    });

  } catch (error) {
    // ROLLBACK on any error (if transaction was started)
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('❌ Error during ROLLBACK:', rollbackError.message);
      }
    }

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
  } finally {
    // Release the client back to the pool
    if (client) {
      client.release();
    }
  }
});

// IMPORTANT: Specific routes MUST come before generic /:order_id route
// Otherwise Express will match /recent and /search as /:order_id!

// Get recent orders with customer/employee details (for manager view)
router.get('/recent', async (req, res) => {
  try {
    console.log('📋 GET /api/orders/recent - Request received');
    const limit = req.query.limit || 50;
    console.log('   Limit:', limit);

    const sqlQuery = `SELECT
      so.order_id,
      so.customer_id,
      so.employee_id,
      so.order_date,
      so.order_details,
      so.subtotal,
      so.tax,
      so.total,
      so.payment_method,
      so.order_status,
      c.username as customer_username,
      c.first_name as customer_first_name,
      c.last_name as customer_last_name,
      e.username as employee_username,
      e.first_name as employee_first_name,
      e.last_name as employee_last_name
     FROM sales_orders so
     LEFT JOIN customers c ON so.customer_id::INTEGER = c.customerid
     LEFT JOIN employees e ON so.employee_id::INTEGER = e.employeeid
     ORDER BY so.order_date DESC
     LIMIT $1`;

    console.log('   Executing query...');
    const result = await query(sqlQuery, [limit]);

    console.log(`   ✅ Found ${result.rows.length} orders`);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error in GET /api/orders/recent:');
    console.error('   Error name:', error.name);
    console.error('   Error message:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Error stack:', error.stack);
    res.status(500).json({
      error: 'Failed to fetch recent orders',
      details: error.message,
      code: error.code
    });
  }
});

// Search orders (for manager view)
router.get('/search', async (req, res) => {
  try {
    console.log('🔍 GET /api/orders/search - Request received');
    const { orderId, customerUsername, employeeUsername } = req.query;
    console.log('   Search params:', { orderId, customerUsername, employeeUsername });

    let queryText = `
      SELECT
        so.order_id,
        so.customer_id,
        so.employee_id,
        so.order_date,
        so.order_details,
        so.subtotal,
        so.tax,
        so.total,
        so.payment_method,
        so.order_status,
        c.username as customer_username,
        c.first_name as customer_first_name,
        c.last_name as customer_last_name,
        e.username as employee_username,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name
      FROM sales_orders so
      LEFT JOIN customers c ON so.customer_id::INTEGER = c.customerid
      LEFT JOIN employees e ON so.employee_id::INTEGER = e.employeeid
      WHERE 1=1
    `;

    const queryParams = [];
    let paramCount = 1;

    // Search by order ID (exact match)
    if (orderId) {
      queryText += ` AND so.order_id = $${paramCount}`;
      queryParams.push(parseInt(orderId));
      paramCount++;
    }

    // Search by customer username (partial match, case-insensitive)
    if (customerUsername) {
      queryText += ` AND LOWER(c.username) LIKE LOWER($${paramCount})`;
      queryParams.push(`%${customerUsername}%`);
      paramCount++;
    }

    // Search by employee username (partial match, case-insensitive)
    if (employeeUsername) {
      queryText += ` AND LOWER(e.username) LIKE LOWER($${paramCount})`;
      queryParams.push(`%${employeeUsername}%`);
      paramCount++;
    }

    queryText += ' ORDER BY so.order_date DESC LIMIT 100';

    console.log('   Query params:', queryParams);
    console.log('   Executing search query...');
    const result = await query(queryText, queryParams);

    console.log(`   ✅ Found ${result.rows.length} matching orders`);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error in GET /api/orders/search:');
    console.error('   Error name:', error.name);
    console.error('   Error message:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Error stack:', error.stack);
    res.status(500).json({
      error: 'Failed to search orders',
      details: error.message,
      code: error.code
    });
  }
});

// Get customer order history
router.get('/customer/:customer_id', async (req, res) => {
  try {
    const { customer_id } = req.params;
    const limit = req.query.limit || 50;

    const result = await query(
      `SELECT order_id, customer_id, employee_id, order_date, order_details,
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

// Get order by ID (MUST be last - it's a catch-all route)
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

export default router;
