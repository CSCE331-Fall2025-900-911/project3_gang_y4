import express from 'express';
import { query } from '../db.js';

const router = express.Router();

/**
 * POST /api/auth/google
 * Authenticates a user with Google OAuth
 * 
 * Request body: { googleId: string, email: string, name: string, picture: string }
 * Response: { user: { id, username, email, ... } }
 * 
 * Note: User info is already verified by Google on the frontend.
 * For production, you may want to verify the access token server-side.
 * 
 * TEMPORARY: Database operations are commented out - just returns Google user info directly
 */
router.post('/google', async (req, res) => {
  try {
    const { googleId, email, name, picture } = req.body;

    if (!googleId || !email) {
      return res.status(400).json({ error: 'Google ID and email are required' });
    }

    // TEMPORARY: Skip database operations and return Google user info directly
    // Generate a username from email (or use name)
    const username = email.split('@')[0] || name?.toLowerCase().replace(/\s+/g, '_') || `user_${Date.now()}`;
    
    // Create user object from Google info (without database)
    const user = {
      id: googleId, // Use Google ID as user ID temporarily
      username: username,
      email: email,
      name: name || null,
      picture_url: picture || null,
      google_id: googleId,
      // password: null (not included in response)
    };

    console.log('Google user authenticated (no DB):', user.email);

    // COMMENTED OUT: Database operations (uncomment when DB connection is working)
    /*
    // Check if user exists with this Google ID
    let userResult = await query(
      'SELECT * FROM users WHERE google_id = $1',
      [googleId]
    );

    let user;

    if (userResult.rows.length > 0) {
      // User exists with this Google ID - update last login
      user = userResult.rows[0];
      
      // Optionally update last login timestamp if you have that column
      // await query(
      //   'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      //   [user.id]
      // );
      
      console.log('Existing Google user logged in:', user.id);
    } else {
      // Check if user exists with this email (for linking existing accounts)
      const emailResult = await query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (emailResult.rows.length > 0) {
        // User exists with this email - link Google ID to existing account
        user = emailResult.rows[0];
        
        await query(
          'UPDATE users SET google_id = $1 WHERE id = $2',
          [googleId, user.id]
        );
        
        console.log('Linked Google ID to existing user:', user.id);
      } else {
        // Create new user with Google authentication
        // Note: Adjust column names to match your actual users table structure
        // Assumes your table has: id, username, email, password, google_id
        // Optional: name, picture_url columns if you want to store them
        
        // Generate a username from email (or use name)
        const username = email.split('@')[0] || name?.toLowerCase().replace(/\s+/g, '_') || `user_${Date.now()}`;
        
        // Check if username already exists and make it unique if needed
        let finalUsername = username;
        let counter = 1;
        while (true) {
          const existingUser = await query(
            'SELECT id FROM users WHERE username = $1',
            [finalUsername]
          );
          if (existingUser.rows.length === 0) break;
          finalUsername = `${username}${counter}`;
          counter++;
        }
        
        // Insert new user (password can be NULL for Google-authenticated users)
        // Adjust the INSERT statement to match your exact table schema
        const insertResult = await query(
          `INSERT INTO users (username, email, google_id, password)
           VALUES ($1, $2, $3, NULL)
           RETURNING *`,
          [finalUsername, email, googleId]
        );
        
        user = insertResult.rows[0];
        console.log('Created new Google user:', user.id);
      }
    }

    // Return user data (exclude sensitive fields like password)
    const { password, ...userData } = user;
    */

    // Return user data
    res.json({
      success: true,
      user: user
    });

  } catch (error) {
    console.error('Google authentication error:', error);
    
    // Handle database errors (commented out for now)
    /*
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'User with this email or Google ID already exists' });
    }
    */
    
    res.status(500).json({ error: 'Authentication failed', details: error.message });
  }
});

/**
 * POST /api/auth/employee
 * Authenticates an employee with username and password
 *
 * Request body: { username: string, password: string }
 * Response: { success: true, user: { employeeid, first_name, last_name, username, level } }
 *
 * Note: Queries the employees table and verifies credentials.
 * Only allows users with level='Employee' to login through this endpoint.
 */
router.post('/employee', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Query database for employee with matching username, password, and level='Employee'
    const employeeResult = await query(
      'SELECT * FROM employees WHERE username = $1 AND password = $2 AND level = $3',
      [username, password, 'Employee']
    );

    // Check if employee exists
    if (employeeResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials or insufficient permissions' });
    }

    const employee = employeeResult.rows[0];

    console.log('Employee authenticated:', employee.username);

    // Return employee data (exclude sensitive fields like password)
    const { password: _, ...employeeData } = employee;

    res.json({
      success: true,
      user: employeeData
    });

  } catch (error) {
    console.error('Employee authentication error:', error);

    // Handle database errors
    if (error.code === '42P01') { // Table doesn't exist
      return res.status(500).json({
        error: 'Database configuration error',
        details: 'Employees table not found. Please ensure the database is properly set up.'
      });
    }

    res.status(500).json({
      error: 'Authentication failed',
      details: error.message
    });
  }
});

/**
 * POST /api/auth/manager
 * Authenticates a manager/owner with username and password
 *
 * Request body: { username: string, password: string }
 * Response: { success: true, user: { employeeid, first_name, last_name, username, level } }
 *
 * Note: Queries the employees table and verifies credentials.
 * Only allows users with level='Manager' or level='Owner' to login through this endpoint.
 */
router.post('/manager', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Query database for manager/owner with matching username and password
    const employeeResult = await query(
      'SELECT * FROM employees WHERE username = $1 AND password = $2 AND (level = $3 OR level = $4)',
      [username, password, 'Manager', 'Owner']
    );

    // Check if manager/owner exists
    if (employeeResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials or insufficient permissions' });
    }

    const employee = employeeResult.rows[0];

    console.log('Manager authenticated:', employee.username);

    // Return employee data (exclude sensitive fields like password)
    const { password: _, ...employeeData } = employee;

    res.json({
      success: true,
      user: employeeData
    });

  } catch (error) {
    console.error('Manager authentication error:', error);

    // Handle database errors
    if (error.code === '42P01') { // Table doesn't exist
      return res.status(500).json({
        error: 'Database configuration error',
        details: 'Employees table not found. Please ensure the database is properly set up.'
      });
    }

    res.status(500).json({
      error: 'Authentication failed',
      details: error.message
    });
  }
});

export default router;

