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

export default router;
