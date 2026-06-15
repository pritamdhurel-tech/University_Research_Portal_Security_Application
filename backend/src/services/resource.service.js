// Resource management service with ABAC integration

const { prisma } = require('../../config/database');
const { withAudit } = require('../utility/auditLogger');

class ResourceService {
  /**
   * Create new resource
   */
  async createResource(resourceData, userId, context = {}) {
    return withAudit('CREATE_RESOURCE', userId, async () => {
      const {
        title,
        description,
        type,
        sensitivityLevel,
        department,
        requiresOnCampusAccess,
        allowDownload,
      } = resourceData;

      // Create resource
      const resource = await prisma.resource.create({
        data: {
          title,
          description,
          type,
          sensitivityLevel,
          department,
          ownerId: userId,
          requiresOnCampusAccess: requiresOnCampusAccess || false,
          allowDownload: allowDownload !== false, // Default true
        },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
              department: true,
            },
          },
        },
      });

      return resource;
    }, context);
  }

  /**
   * Get all resources (will be filtered by ABAC)
   */
  async getAllResources(filters = {}) {
    const { type, department, sensitivityLevel, isActive = true } = filters;

    const resources = await prisma.resource.findMany({
      where: {
        ...(type && { type }),
        ...(department && { department }),
        ...(sensitivityLevel && { sensitivityLevel }),
        isActive,
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            department: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return resources;
  }

  /**
   * Get resource by ID
   */
  async getResourceById(id) {
    const resource = await prisma.resource.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            department: true,
          },
        },
      },
    });

    if (!resource) {
      throw new Error('Resource not found');
    }

    return resource;
  }

  /**
   * Update resource
   */
  async updateResource(id, updateData, userId, context = {}) {
    return withAudit('UPDATE_RESOURCE', userId, async () => {
      // Check if resource exists
      const existingResource = await this.getResourceById(id);

      // Update resource
      const resource = await prisma.resource.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
              department: true,
            },
          },
        },
      });

      return resource;
    }, context);
  }

  /**
   * Delete resource (soft delete)
   */
  async deleteResource(id, userId, context = {}) {
    return withAudit('DELETE_RESOURCE', userId, async () => {
      // Check if resource exists
      await this.getResourceById(id);

      // Soft delete (set isActive to false)
      const resource = await prisma.resource.update({
        where: { id },
        data: {
          isActive: false,
        },
      });

      return { success: true, message: 'Resource deleted successfully' };
    }, context);
  }

  /**
   * Get resources accessible by user (ABAC pre-filtering)
   * This is a helper to show only resources user CAN access
   */
  async getAccessibleResources(user) {
    const allResources = await this.getAllResources();

    // Import ABAC engine
    const { abacEngine } = require('./abac/abac.engine');

    // Check each resource
    const accessibleResources = [];

    for (const resource of allResources) {
      const decision = await abacEngine.evaluate({
        subject: {
          id: user.id,
          role: user.role,
          department: user.department,
          clearanceLevel: user.clearanceLevel,
          isActive: user.isActive,
          isVerified: user.isVerified,
          isLocked: user.isLocked,
        },
        resource: {
          id: resource.id,
          type: resource.type,
          department: resource.department,
          sensitivityLevel: resource.sensitivityLevel,
          ownerId: resource.ownerId,
          requiresOnCampusAccess: resource.requiresOnCampusAccess,
        },
        action: 'READ',
        environment: {
          accessLocation: user.lastLoginLocation || 'UNKNOWN',
        },
      });

      if (decision.allowed) {
        accessibleResources.push({
          ...resource,
          _abacDecision: decision, // Include decision info
        });
      }
    }

    return accessibleResources;
  }
}

module.exports = new ResourceService();