import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// Get all inventory items
router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT ingredientid, item_name, quantity FROM inventory ORDER BY item_name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory items' });
  }
});

// Get single inventory item by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT ingredientid, item_name, quantity FROM inventory WHERE ingredientid = $1',
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
      'INSERT INTO inventory (item_name, quantity) VALUES ($1, $2) RETURNING *',
      [item_name, quantity]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding inventory item:', error);
    res.status(500).json({ error: 'Failed to add inventory item' });
  }
});

// Update inventory item
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { item_name, quantity } = req.body;

    if (!item_name || quantity === undefined) {
      return res.status(400).json({ error: 'Item name and quantity are required' });
    }

    const result = await query(
      'UPDATE inventory SET item_name = $1, quantity = $2 WHERE ingredientid = $3 RETURNING *',
      [item_name, quantity, id]
    );

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
