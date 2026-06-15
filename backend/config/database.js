// Prisma client setup with connection pooling

const { PrismaClient } = require('@prisma/client');

// Create Prisma client with production settings
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
  
  errorFormat: 'minimal',
});

// Test connection on startup
async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log(' Database connected successfully');
  } catch (error) {
    console.error(' Database connection failed:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
async function disconnectDatabase() {
  await prisma.$disconnect();
  console.log(' Database disconnected');
}

// Handle shutdown signals
process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDatabase();
  process.exit(0);
});

module.exports = { 
  prisma, 
  connectDatabase, 
  disconnectDatabase 
};