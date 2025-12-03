import express from 'express';
import pool, { query } from '../db.js';

const router = express.Router();

// Get all inventory items
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT
        ingredientid,
        item_name,
        quantity
      FROM inventory
      ORDER BY item_name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory items' });
  }
});

// Get low stock items only (using threshold of 10 as default)
router.get('/low-stock', async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 10;
    const result = await query(`
      SELECT
        ingredientid,
        item_name,
        quantity
      FROM inventory
      WHERE quantity <= $1
      ORDER BY quantity ASC, item_name ASC
    `, [threshold]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({ error: 'Failed to fetch low stock items' });
  }
});

// Get stock status for menu items
router.get('/menu-stock-status', async (req, res) => {
  try {
    // Get stock status for all menu items based on their ingredient requirements
    const lowStockThreshold = parseInt(req.query.threshold) || 10;
    const result = await query(`
      SELECT
        m.menuid,
        m.menu_name,
        m.item_type,
        CASE
          WHEN COUNT(mi.inventoryid) = 0 THEN 'NO_INVENTORY_REQUIRED'
          WHEN MIN(CASE
            WHEN i.quantity = 0 THEN 0
            WHEN i.quantity < mi.quantity THEN 1
            WHEN i.quantity <= $1 THEN 2
            ELSE 3
          END) = 0 THEN 'OUT_OF_STOCK'
          WHEN MIN(CASE
            WHEN i.quantity = 0 THEN 0
            WHEN i.quantity < mi.quantity THEN 1
            WHEN i.quantity <= $1 THEN 2
            ELSE 3
          END) = 1 THEN 'INSUFFICIENT_STOCK'
          WHEN MIN(CASE
            WHEN i.quantity = 0 THEN 0
            WHEN i.quantity < mi.quantity THEN 1
            WHEN i.quantity <= $1 THEN 2
            ELSE 3
          END) = 2 THEN 'LOW_STOCK'
          ELSE 'IN_STOCK'
        END as stock_status,
        COALESCE(json_agg(json_build_object(
          'inventory_id', i.ingredientid,
          'inventory_name', i.item_name,
          'current_stock', i.quantity,
          'required_per_item', mi.quantity
        )) FILTER (WHERE i.ingredientid IS NOT NULL), '[]') as ingredients
      FROM menu m
      LEFT JOIN menuinventory mi ON m.menuid = mi.menuid
      LEFT JOIN inventory i ON mi.inventoryid = i.ingredientid
      GROUP BY m.menuid, m.menu_name, m.item_type
      ORDER BY m.item_type, m.menu_name
    `, [lowStockThreshold]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching menu stock status:', error);
    res.status(500).json({ error: 'Failed to fetch menu stock status' });
  }
});

// Get inventory transaction history
// NOTE: Requires inventory_transactions table from migration
router.get('/transactions/history', async (req, res) => {
  try {
    // Check if inventory_transactions table exists
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'inventory_transactions'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      return res.status(501).json({
        error: 'Transaction history not available',
        message: 'Run server/migrations/create_inventory_transactions.sql to enable this feature'
      });
    }

    const limit = req.query.limit || 100;
    const inventoryId = req.query.inventory_id;

    let queryText = `
      SELECT
        it.transaction_id,
        it.inventory_id,
        i.item_name,
        it.order_id,
        it.quantity_change,
        it.transaction_type,
        it.transaction_date,
        it.employee_id,
        e.username as employee_username,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name,
        it.notes
      FROM inventory_transactions it
      LEFT JOIN inventory i ON it.inventory_id = i.ingredientid
      LEFT JOIN employees e ON it.employee_id = e.employeeid
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (inventoryId) {
      queryText += ` AND it.inventory_id = $${paramCount}`;
      params.push(parseInt(inventoryId));
      paramCount++;
    }

    queryText += ` ORDER BY it.transaction_date DESC LIMIT $${paramCount}`;
    params.push(limit);

    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    res.status(500).json({ error: 'Failed to fetch transaction history' });
  }
});

// Restock inventory item
router.post('/restock/:id', async (req, res) => {
  let client;

  try {
    const { id } = req.params;
    const { quantity, employee_id, notes } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive number' });
    }

    client = await pool.connect();
    await client.query('BEGIN');

    // Update inventory quantity (no last_restocked column yet)
    const updateResult = await client.query(
      `UPDATE inventory
       SET quantity = quantity + $1
       WHERE ingredientid = $2
       RETURNING *`,
      [quantity, id]
    );

    if (updateResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    const updatedItem = updateResult.rows[0];

    // TODO: Add transaction logging after creating inventory_transactions table
    // To enable: Run server/migrations/create_inventory_transactions.sql

    await client.query('COMMIT');

    console.log(`✅ Restocked ${updatedItem.item_name}: +${quantity} (new stock: ${updatedItem.quantity})`);

    res.json({
      success: true,
      message: 'Inventory restocked successfully',
      item: updatedItem,
      restocked_quantity: quantity
    });

  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error during ROLLBACK:', rollbackError);
      }
    }

    console.error('Error restocking inventory:', error);
    res.status(500).json({ error: 'Failed to restock inventory item' });
  } finally {
    if (client) {
      client.release();
    }
  }
});

// Manual inventory adjustment (increase or decrease)
router.post('/adjust/:id', async (req, res) => {
  let client;

  try {
    const { id } = req.params;
    const { quantity_change, employee_id, notes } = req.body;

    if (!quantity_change || quantity_change === 0) {
      return res.status(400).json({ error: 'quantity_change cannot be zero' });
    }

    client = await pool.connect();
    await client.query('BEGIN');

    // Check current stock
    const checkResult = await client.query(
      'SELECT * FROM inventory WHERE ingredientid = $1 FOR UPDATE',
      [id]
    );

    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    const currentItem = checkResult.rows[0];
    const newQuantity = parseFloat(currentItem.quantity) + parseFloat(quantity_change);

    if (newQuantity < 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Adjustment would result in negative stock',
        current_quantity: currentItem.quantity,
        requested_change: quantity_change,
        resulting_quantity: newQuantity
      });
    }

    // Update inventory quantity
    const updateResult = await client.query(
      `UPDATE inventory
       SET quantity = $1
       WHERE ingredientid = $2
       RETURNING *`,
      [newQuantity, id]
    );

    const updatedItem = updateResult.rows[0];

    // TODO: Add transaction logging after creating inventory_transactions table
    // To enable: Run server/migrations/create_inventory_transactions.sql

    await client.query('COMMIT');

    console.log(`✅ Adjusted ${updatedItem.item_name}: ${quantity_change > 0 ? '+' : ''}${quantity_change} (new stock: ${updatedItem.quantity})`);

    res.json({
      success: true,
      message: 'Inventory adjusted successfully',
      item: updatedItem,
      quantity_change: quantity_change
    });

  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error during ROLLBACK:', rollbackError);
      }
    }

    console.error('Error adjusting inventory:', error);
    res.status(500).json({ error: 'Failed to adjust inventory item' });
  } finally {
    if (client) {
      client.release();
    }
  }
});

// Get single inventory item by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT
        ingredientid,
        item_name,
        quantity
      FROM inventory
      WHERE ingredientid = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({ error: 'Failed to fetch inventory item' });
  }
});

// Add new inventory item
router.post('/', async (req, res) => {
  try {
    const { item_name, quantity } = req.body;

    if (!item_name || quantity === undefined) {
      return res.status(400).json({ error: 'Item name and quantity are required' });
    }

    const result = await query(
      `INSERT INTO inventory (item_name, quantity)
       VALUES ($1, $2)
       RETURNING *`,
      [item_name, quantity]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding inventory item:', error);
    res.status(500).json({ error: 'Failed to add inventory item' });
  }
});

// Update inventory item name and quantity
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { item_name, quantity } = req.body;

    if (!item_name) {
      return res.status(400).json({ error: 'Item name is required' });
    }

    // If quantity is provided, update both. Otherwise, just update name.
    let result;
    if (quantity !== undefined) {
      result = await query(
        `UPDATE inventory
         SET item_name = $1, quantity = $2
         WHERE ingredientid = $3
         RETURNING *`,
        [item_name, quantity, id]
      );
    } else {
      result = await query(
        `UPDATE inventory
         SET item_name = $1
         WHERE ingredientid = $2
         RETURNING *`,
        [item_name, id]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ error: 'Failed to update inventory item' });
  }
});

// Delete inventory item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM inventory WHERE ingredientid = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    res.json({ message: 'Inventory item deleted successfully', item: result.rows[0] });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ error: 'Failed to delete inventory item' });
  }
});

export default router;
