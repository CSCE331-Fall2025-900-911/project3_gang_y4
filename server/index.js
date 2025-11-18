import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './db.js';
import menuRoutes from './routes/menu.js';
import customizationRoutes from './routes/customizations.js';
import orderRoutes from './routes/orders.js';
import authRoutes from './routes/auth.js';
import inventoryRoutes from './routes/inventory.js';
import employeeRoutes from './routes/employees.js';
import analyticsRoutes from './routes/analytics.js';
import salesRoutes from './routes/sales.js';
import customerRoutes from './routes/customers.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`\n${req.method} ${req.path}`);
  console.log(`   URL: ${req.url}`);
  console.log(`   Original URL: ${req.originalUrl}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/menu', menuRoutes);
app.use('/api/customizations', customizationRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/customers', customerRoutes);

app.get('/', (req, res) => {
  res.send('✅ Express backend is running on Render!');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection before starting (warn but don't exit for testing)
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.warn('⚠️  Warning: Failed to connect to database. Server will start but database operations will fail.');
      console.warn('   Please check your .env file if you need database functionality.');
    } else {
      console.log('✅ Database connection successful');
    }

    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`📋 Menu API: http://localhost:${PORT}/api/menu`);
      console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
      console.log(`📦 Inventory API: http://localhost:${PORT}/api/inventory`);
      console.log(`👥 Employees API: http://localhost:${PORT}/api/employees`);
      console.log(`📊 Analytics API: http://localhost:${PORT}/api/analytics`);
      console.log(`\n✨ Server is ready to accept requests!\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
