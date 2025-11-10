import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// Get all add-ons (items that cost money and are added to drinks)
router.get('/addons', async (req, res) => {
  try {
    const result = await query(
      `SELECT menuid, menu_name, price 
       FROM menu 
       WHERE item_type = 'Add-On' 
       ORDER BY menu_name`
    );
    
    const addons = result.rows.map(row => ({
      id: row.menuid,
      name: row.menu_name,
      price: parseFloat(row.price)
    }));
    
    res.json(addons);
  } catch (error) {
    console.error('Error fetching add-ons:', error);
    res.status(500).json({ error: 'Failed to fetch add-ons' });
  }
});

// Get all customizations (typically free options like ice level, sugar level)
router.get('/customizations', async (req, res) => {
  try {
    const result = await query(
      `SELECT menuid, menu_name, price 
       FROM menu 
       WHERE item_type = 'Customization' 
       ORDER BY menu_name`
    );
    
    const customizations = result.rows.map(row => ({
      id: row.menuid,
      name: row.menu_name,
      price: parseFloat(row.price)
    }));
    
    res.json(customizations);
  } catch (error) {
    console.error('Error fetching customizations:', error);
    res.status(500).json({ error: 'Failed to fetch customizations' });
  }
});

// Get customizations grouped by type (ice, sweetness, etc.)
router.get('/grouped', async (req, res) => {
  try {
    const result = await query(
      `SELECT menuid, menu_name, price 
       FROM menu 
       WHERE item_type = 'Customization' 
       ORDER BY menu_name`
    );
    
    // Group customizations by type (ice level, sugar level, etc.)
    const grouped = {
      ice: [],
      sweetness: []
    };
    
    result.rows.forEach(row => {
      const item = {
        id: row.menuid,
        name: row.menu_name,
        price: parseFloat(row.price)
      };
      
      const nameLower = row.menu_name.toLowerCase();
      if (nameLower.includes('ice')) {
        grouped.ice.push(item);
      } else if (nameLower.includes('sweet') || nameLower.includes('sugar')) {
        grouped.sweetness.push(item);
      }
    });
    
    res.json(grouped);
  } catch (error) {
    console.error('Error fetching grouped customizations:', error);
    res.status(500).json({ error: 'Failed to fetch customizations' });
  }
});

export default router;
