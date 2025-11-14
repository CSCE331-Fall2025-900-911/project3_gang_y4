import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// Submit a new order
router.post('/', async (req, res) => {
  try {
    const {} = req.body;
  } 
  catch (error) {
    console.error('Error creating sale:', error);
    res.status(500).json({ error: 'Failed to create sale' });
  }
});