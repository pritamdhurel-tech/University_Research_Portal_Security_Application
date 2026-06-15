const { prisma } = require('../../config/database');
const { hashPassword } = require('./password');

async function seedAdmin() {
  try {
    const adminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@gmail.com';
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (!existingAdmin) {
      console.log('Seeding super admin...');
      const adminPassword = process.env.SUPER_ADMIN_PASSWORD || 'Admin123!@#';
      const passwordHash = await hashPassword(adminPassword);

      await prisma.user.create({
        data: {
          email: adminEmail,
          passwordHash,
          firstName: 'Super',
          lastName: 'Admin',
          role: 'ADMIN',
          department: 'COMPUTER_SCIENCE', 
          clearanceLevel: 'RESTRICTED',
          isActive: true,
          isVerified: true
        }
      });
      console.log('Super admin created successfully.');
      console.log(`Email: ${adminEmail}`);
      console.log(`Password: ${adminPassword}`);
    } else {
      console.log('Super admin already exists.');
    }
  } catch (error) {
    console.error('Error seeding super admin:', error);
  }
}

module.exports = { seedAdmin };

// Allow running directly from command line
if (require.main === module) {
  seedAdmin().then(() => {
    console.log('Seed process finished');
    process.exit(0);
  }).catch((err) => {
    console.error('Seed process failed', err);
    process.exit(1);
  });
}
