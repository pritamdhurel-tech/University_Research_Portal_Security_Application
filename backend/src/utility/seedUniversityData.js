const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedData() {
  try {
    console.log('Starting university data seed...');

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash('Professor123!', salt);

    // 1. Create Professors
    const professors = [
      {
        email: 'dr.alan@university.edu',
        firstName: 'Alan',
        lastName: 'Turin',
        role: 'PROFESSOR',
        department: 'COMPUTER_SCIENCE',
        clearanceLevel: 'CONFIDENTIAL',
        isActive: true,
        isVerified: true,
      },
      {
        email: 'dr.sarah@university.edu',
        firstName: 'Sarah',
        lastName: 'Gilbert',
        role: 'PROFESSOR',
        department: 'MEDICINE',
        clearanceLevel: 'RESTRICTED',
        isActive: true,
        isVerified: true,
      }
    ];

    for (const prof of professors) {
      await prisma.user.upsert({
        where: { email: prof.email },
        update: {},
        create: {
          ...prof,
          passwordHash,
        },
      });
    }

    const profAlan = await prisma.user.findUnique({ where: { email: 'dr.alan@university.edu' } });
    const profSarah = await prisma.user.findUnique({ where: { email: 'dr.sarah@university.edu' } });

    // 2. Create Research Papers
    const papers = [
      {
        title: 'Deep Learning in Cyber-Physical Systems',
        description: 'An analysis of neural network robustness in industrial IoT environments.',
        type: 'PAPER',
        sensitivityLevel: 'INTERNAL',
        department: 'COMPUTER_SCIENCE',
        ownerId: profAlan.id,
        doi: '10.1109/CPS.2024.001',
      },
      {
        title: 'Zero-Trust Architectures for Distributed Academic Networks',
        description: 'Implementing identity-centric boundary controls in campus infrastructure.',
        type: 'PAPER',
        sensitivityLevel: 'CONFIDENTIAL',
        department: 'COMPUTER_SCIENCE',
        ownerId: profAlan.id,
      },
      {
        title: 'Genomic Sequencing of Novel Pathogens',
        description: 'Rapid analysis and classification of emerging viral strains using CRISPR-Cas9.',
        type: 'PAPER',
        sensitivityLevel: 'RESTRICTED',
        department: 'MEDICINE',
        ownerId: profSarah.id,
        requiresOnCampusAccess: true,
      },
      {
        title: 'Neural Mapping of Alzheimer’s Progression',
        description: 'Longitudinal study of hippocampal decay in early-onset patients.',
        type: 'PAPER',
        sensitivityLevel: 'CONFIDENTIAL',
        department: 'MEDICINE',
        ownerId: profSarah.id,
      }
    ];

    for (const paper of papers) {
      await prisma.resource.create({
        data: paper
      });
    }

    console.log('Successfully seeded professors and research papers.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedData();
