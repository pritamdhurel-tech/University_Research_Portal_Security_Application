require('dotenv').config();

const app = require('./app');

const port = process.env.PORT   || 8000;

const { connectDatabase } = require('../config/database');
const config = require('../config/env');
const { seedAdmin } = require('./utility/seedAdmin');

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    
    // Seed Super Admin
    await seedAdmin();
    
    // Start listening
    const port = config.port;
    app.listen(port, () => {
      console.log('');
      console.log('University Research Portal API');
      console.log(`Server running on port ${port}`);
      console.log(`Environment: ${config.nodeEnv}`);
      console.log(`API: http://localhost:${port}/api`);
      console.log(`Health: http://localhost:${port}/api/health`);
      console.log('');
      console.log('Available endpoints:');
      console.log('   POST   /api/auth/register - Register new user');
      console.log('   POST   /api/auth/login    - Login user');
      console.log('   POST   /api/auth/refresh  - Refresh token');
      console.log('   POST   /api/auth/logout   - Logout user');
      console.log('   GET    /api/auth/me       - Get current user');
      console.log('');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer();


app.listen(port, () => {
    console.log(`Server is running on ${port} Port`);
});

// Restarting nodemon
