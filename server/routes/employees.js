import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// Get all employees
router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT employeeid, first_name, last_name, username, level FROM employees ORDER BY employeeid'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// Get single employee by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT employeeid, first_name, last_name, username, level FROM employees WHERE employeeid = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

// Add new employee
router.post('/', async (req, res) => {
  try {
    const { first_name, last_name, username, password, level } = req.body;

    if (!first_name || !last_name || !username || !password) {
      return res.status(400).json({ error: 'First name, last name, username, and password are required' });
    }

    // Check if username already exists
    const existingUser = await query(
      'SELECT employeeid FROM employees WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const result = await query(
      'INSERT INTO employees (first_name, last_name, username, password, level) VALUES ($1, $2, $3, $4, $5) RETURNING employeeid, first_name, last_name, username, level',
      [first_name, last_name, username, password, level || 'Employee']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding employee:', error);
    res.status(500).json({ error: 'Failed to add employee' });
  }
});

// Update employee
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, username, password, level } = req.body;

    if (!first_name || !last_name || !username) {
      return res.status(400).json({ error: 'First name, last name, and username are required' });
    }

    // Check if username already exists for a different employee
    const existingUser = await query(
      'SELECT employeeid FROM employees WHERE username = $1 AND employeeid != $2',
      [username, id]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // Build update query dynamically based on whether password is included
    let updateQuery;
    let params;

    if (password) {
      updateQuery = 'UPDATE employees SET first_name = $1, last_name = $2, username = $3, password = $4, level = $5 WHERE employeeid = $6 RETURNING employeeid, first_name, last_name, username, level';
      params = [first_name, last_name, username, password, level || 'Employee', id];
    } else {
      updateQuery = 'UPDATE employees SET first_name = $1, last_name = $2, username = $3, level = $4 WHERE employeeid = $5 RETURNING employeeid, first_name, last_name, username, level';
      params = [first_name, last_name, username, level || 'Employee', id];
    }

    const result = await query(updateQuery, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// Delete employee
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM employees WHERE employeeid = $1 RETURNING employeeid, first_name, last_name, username, level',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({ message: 'Employee deleted successfully', employee: result.rows[0] });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

export default router;
