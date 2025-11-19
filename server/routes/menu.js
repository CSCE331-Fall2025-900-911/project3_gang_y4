import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// Get all menu items
router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT menuid, menu_name, price, item_type FROM menu ORDER BY item_type, menu_name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

// Get menu items grouped by category
router.get('/grouped', async (req, res) => {
  try {
    const result = await query(
      'SELECT menuid, menu_name, price, item_type FROM menu ORDER BY item_type, menu_name'
    );
    
    // Group items by type
    const grouped = result.rows.reduce((acc, item) => {
      const category = item.item_type;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({
        id: item.menuid,
        name: item.menu_name,
        price: parseFloat(item.price),
        type: item.item_type
      });
      return acc;
    }, {});

    // Convert to array format for frontend
    const menuData = Object.keys(grouped).map(category => ({
      category: category,
      items: grouped[category]
    }));

    res.json(menuData);
  } catch (error) {
    console.error('Error fetching grouped menu:', error);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

// Get menu items by category
router.get('/category/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const result = await query(
      'SELECT menuid, menu_name, price, item_type FROM menu WHERE item_type = $1 ORDER BY menu_name',
      [type]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching menu by category:', error);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

// Get single menu item by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT menuid, menu_name, price, item_type FROM menu WHERE menuid = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching menu item:', error);
    res.status(500).json({ error: 'Failed to fetch menu item' });
  }
});

// Add new menu item
router.post('/', async (req, res) => {
  try {
    const { menu_name, price, item_type } = req.body;

    if (!menu_name || price === undefined || !item_type) {
      return res.status(400).json({ error: 'Menu name, price, and item type are required' });
    }

    const result = await query(
      'INSERT INTO menu (menu_name, price, item_type) VALUES ($1, $2, $3) RETURNING *',
      [menu_name, price, item_type]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding menu item:', error);
    res.status(500).json({ error: 'Failed to add menu item' });
  }
});

// Update menu item
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { menu_name, price, item_type } = req.body;

    if (!menu_name || price === undefined || !item_type) {
      return res.status(400).json({ error: 'Menu name, price, and item type are required' });
    }

    const result = await query(
      'UPDATE menu SET menu_name = $1, price = $2, item_type = $3 WHERE menuid = $4 RETURNING *',
      [menu_name, price, item_type, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

// Delete menu item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM menu WHERE menuid = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    res.json({ message: 'Menu item deleted successfully', item: result.rows[0] });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

// ===== DEPENDENCY MANAGEMENT ENDPOINTS =====

// Get all dependencies for all menu items in one batch call (optimized)
router.get('/dependencies/batch', async (req, res) => {
  try {
    const result = await query(
      `SELECT
        mi.menuid,
        mi.inventoryid,
        i.item_name as name,
        mi.quantity as quantity_needed
      FROM menuinventory mi
      JOIN inventory i ON mi.inventoryid = i.ingredientid
      ORDER BY mi.menuid, i.item_name`
    );

    // Group dependencies by menu_id
    const grouped = result.rows.reduce((acc, row) => {
      if (!acc[row.menuid]) {
        acc[row.menuid] = [];
      }
      acc[row.menuid].push({
        inventory_id: row.inventoryid,
        name: row.name,
        quantity_needed: parseFloat(row.quantity_needed)
      });
      return acc;
    }, {});

    res.json(grouped);
  } catch (error) {
    console.error('Error fetching batch dependencies:', error);
    res.status(500).json({ error: 'Failed to fetch dependencies' });
  }
});

// Get all dependencies (ingredients) for a menu item
router.get('/:menuId/dependencies', async (req, res) => {
  try {
    const { menuId } = req.params;

    // First check if menu item exists
    const menuCheck = await query(
      'SELECT menuid, menu_name FROM menu WHERE menuid = $1',
      [menuId]
    );

    if (menuCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    // Get all dependencies for this menu item
    const result = await query(
      `SELECT
        mi.menuid,
        mi.inventoryid,
        i.item_name as name,
        mi.quantity as quantity_needed
      FROM menuinventory mi
      JOIN inventory i ON mi.inventoryid = i.ingredientid
      WHERE mi.menuid = $1
      ORDER BY i.item_name`,
      [menuId]
    );

    res.json({
      menu_id: parseInt(menuId),
      menu_name: menuCheck.rows[0].menu_name,
      dependencies: result.rows.map(row => ({
        inventory_id: row.inventoryid,
        name: row.name,
        quantity_needed: parseFloat(row.quantity_needed)
      }))
    });
  } catch (error) {
    console.error('Error fetching dependencies:', error);
    res.status(500).json({ error: 'Failed to fetch dependencies' });
  }
});

// Add or update a dependency for a menu item
router.post('/:menuId/dependencies', async (req, res) => {
  try {
    const { menuId } = req.params;
    const { inventory_id, quantity_needed } = req.body;

    // Validate inputs
    if (!inventory_id || quantity_needed === undefined) {
      return res.status(400).json({ error: 'inventory_id and quantity_needed are required' });
    }

    if (quantity_needed <= 0) {
      return res.status(400).json({ error: 'quantity_needed must be greater than 0' });
    }

    // Check if menu item exists
    const menuCheck = await query(
      'SELECT menuid FROM menu WHERE menuid = $1',
      [menuId]
    );

    if (menuCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    // Check if inventory item exists
    const inventoryCheck = await query(
      'SELECT ingredientid, item_name FROM inventory WHERE ingredientid = $1',
      [inventory_id]
    );

    if (inventoryCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    // Insert or update the dependency (upsert)
    const result = await query(
      `INSERT INTO menuinventory (menuid, inventoryid, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (menuid, inventoryid)
       DO UPDATE SET quantity = $3
       RETURNING *`,
      [menuId, inventory_id, quantity_needed]
    );

    res.status(201).json({
      menu_id: parseInt(menuId),
      inventory_id: result.rows[0].inventoryid,
      quantity_needed: parseFloat(result.rows[0].quantity),
      message: 'Dependency added/updated successfully'
    });
  } catch (error) {
    console.error('Error adding/updating dependency:', error);
    res.status(500).json({ error: 'Failed to add/update dependency' });
  }
});

// Remove a dependency from a menu item
router.delete('/:menuId/dependencies/:inventoryId', async (req, res) => {
  try {
    const { menuId, inventoryId } = req.params;

    const result = await query(
      'DELETE FROM menuinventory WHERE menuid = $1 AND inventoryid = $2 RETURNING *',
      [menuId, inventoryId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dependency not found' });
    }

    res.json({
      message: 'Dependency removed successfully',
      menu_id: parseInt(menuId),
      inventory_id: parseInt(inventoryId)
    });
  } catch (error) {
    console.error('Error removing dependency:', error);
    res.status(500).json({ error: 'Failed to remove dependency' });
  }
});

export default router;
