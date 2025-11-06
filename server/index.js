import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './db.js';
import menuRoutes from './routes/menu.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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
    // Test database connection before starting
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('Failed to connect to database. Please check your .env file.');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`\nServer running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Menu API: http://localhost:${PORT}/api/menu`);
      console.log(`\nServer is ready to accept requests!\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
