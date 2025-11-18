import express from 'express';
import { query } from '../db.js';

const router = express.Router();

/**
 * Generate a random password for Google OAuth accounts
 * @param {number} length - Length of password (default: 10)
 * @returns {string} Random password
 *
 * Note: These passwords are not used for login (Google OAuth handles authentication),
 * but the database column requires a value.
 */
function generateRandomPassword(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Find or create customer from Google OAuth
router.post('/google-auth', async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }

    console.log('🔍 Google OAuth - Looking up customer by email:', email);

    // Try to find existing customer by email (used as username)
    let result = await query(
      'SELECT customerid as custid, username, first_name, last_name, rewards_points FROM customers WHERE username = $1',
      [email]
    );

    if (result.rows.length > 0) {
      // Customer exists
      const customer = result.rows[0];
      console.log('✅ Existing customer found:', customer.custid, '-', customer.username);
      return res.json({
        custid: customer.custid,
        username: customer.username,
        first_name: customer.first_name,
        last_name: customer.last_name,
        rewards_points: customer.rewards_points,
        is_new: false
      });
    }

    // Customer doesn't exist - create new one
    console.log('📝 Creating new customer for Google OAuth user:', email);

    // Parse name into first and last name
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || name;
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    // Generate random password for database (not used for login - Google OAuth handles auth)
    const randomPassword = generateRandomPassword(10);

    // Create new customer
    try {
      const insertResult = await query(
        `INSERT INTO customers (username, first_name, last_name, password, rewards_points)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING customerid as custid, username, first_name, last_name, rewards_points`,
        [email, firstName, lastName, randomPassword, 0]
      );

      const newCustomer = insertResult.rows[0];
      console.log('✅ New customer created:', newCustomer.custid, '-', newCustomer.username);

      res.status(201).json({
        custid: newCustomer.custid,
        username: newCustomer.username,
        first_name: newCustomer.first_name,
        last_name: newCustomer.last_name,
        rewards_points: newCustomer.rewards_points,
        is_new: true
      });

    } catch (insertError) {
      // Handle race condition: If duplicate key error, customer was created by another request
      if (insertError.code === '23505') {
        console.log('⚠️  Duplicate customer detected (race condition), fetching existing record...');

        // Retry lookup - customer must exist now
        const retryResult = await query(
          'SELECT customerid as custid, username, first_name, last_name, rewards_points FROM customers WHERE username = $1',
          [email]
        );

        if (retryResult.rows.length > 0) {
          const customer = retryResult.rows[0];
          console.log('✅ Retrieved existing customer after race condition:', customer.custid, '-', customer.username);
          return res.json({
            custid: customer.custid,
            username: customer.username,
            first_name: customer.first_name,
            last_name: customer.last_name,
            rewards_points: customer.rewards_points,
            is_new: false
          });
        }
      }

      // Re-throw if not a duplicate key error
      throw insertError;
    }

  } catch (error) {
    console.error('❌ Error in Google OAuth customer lookup/creation:', error);
    res.status(500).json({ error: 'Failed to process customer', details: error.message });
  }
});

// Look up customer by username
router.get('/lookup/:username', async (req, res) => {
  try {
    const { username } = req.params;

    console.log('🔍 Looking up customer:', username);

    const result = await query(
      'SELECT customerid as custid, username, first_name, last_name, rewards_points FROM customers WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      console.log('❌ Customer not found:', username);
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = result.rows[0];
    console.log('✅ Customer found:', customer.custid, '-', customer.username);

    res.json(customer);
  } catch (error) {
    console.error('❌ Error looking up customer:', error);
    res.status(500).json({ error: 'Failed to lookup customer', details: error.message });
  }
});

// Add rewards points to customer account
router.post('/:custid/rewards', async (req, res) => {
  try {
    const { custid } = req.params;
    const { points } = req.body;

    if (!points || points < 0) {
      return res.status(400).json({ error: 'Valid points amount required' });
    }

    console.log('🎁 Adding', points, 'rewards points to customer', custid);

    const result = await query(
      'UPDATE customers SET rewards_points = rewards_points + $1 WHERE customerid = $2 RETURNING customerid as custid, username, first_name, last_name, rewards_points',
      [points, custid]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = result.rows[0];
    console.log('✅ Rewards updated. New balance:', customer.rewards_points);

    res.json({
      success: true,
      custid: customer.custid,
      username: customer.username,
      first_name: customer.first_name,
      last_name: customer.last_name,
      new_rewards_balance: customer.rewards_points,
      points_added: points
    });
  } catch (error) {
    console.error('❌ Error adding rewards:', error);
    res.status(500).json({ error: 'Failed to add rewards', details: error.message });
  }
});

// Get customer details by ID
router.get('/:custid', async (req, res) => {
  try {
    const { custid } = req.params;

    const result = await query(
      'SELECT customerid as custid, username, first_name, last_name, rewards_points FROM customers WHERE customerid = $1',
      [custid]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer', details: error.message });
  }
});

export default router;
