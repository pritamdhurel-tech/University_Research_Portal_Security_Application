// Resource HTTP controllers

const resourceService = require('../services/resource.service');
const { abacEngine } = require('../services/abac/abac.engine');

class ResourceController {
  /**
   * Create new resource
   * POST /api/resources
   */
  async createResource(req, res, next) {
    try {
      const resource = await resourceService.createResource(
        req.body,
        req.user.id,
        req.context
      );

      res.status(201).json({
        success: true,
        message: 'Resource created successfully',
        data: resource,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all accessible resources for current user
   * GET /api/resources
   */
  async getResources(req, res, next) {
    try {
      // Get only resources accessible to this user
      const resources = await resourceService.getAccessibleResources(req.user);

      res.json({
        success: true,
        count: resources.length,
        data: resources,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get specific resource by ID (with ABAC check)
   * GET /api/resources/:id
   */
  async getResourceById(req, res, next) {
    try {
      const { id } = req.params;
      const resource = await resourceService.getResourceById(id);

      // ABAC check already done by middleware
      // If we reached here, access is granted

      res.json({
        success: true,
        data: resource,
        abacDecision: req.abacDecision, // Include decision info
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update resource
   * PUT /api/resources/:id
   */
  async updateResource(req, res, next) {
    try {
      const { id } = req.params;

      const resource = await resourceService.updateResource(
        id,
        req.body,
        req.user.id,
        req.context
      );

      res.json({
        success: true,
        message: 'Resource updated successfully',
        data: resource,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete resource
   * DELETE /api/resources/:id
   */
  async deleteResource(req, res, next) {
    try {
      const { id } = req.params;

      const result = await resourceService.deleteResource(
        id,
        req.user.id,
        req.context
      );

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Test ABAC access to a resource
   * GET /api/resources/:id/check-access
   */
  async checkAccess(req, res, next) {
    try {
      const { id } = req.params;
      const { action = 'READ' } = req.query;

      const resource = await resourceService.getResourceById(id);

      // Manual ABAC check
      const decision = await abacEngine.evaluate({
        subject: {
          id: req.user.id,
          role: req.user.role,
          department: req.user.department,
          clearanceLevel: req.user.clearanceLevel,
          isActive: req.user.isActive,
          isVerified: req.user.isVerified,
          isLocked: req.user.isLocked,
        },
        resource: {
          id: resource.id,
          type: resource.type,
          department: resource.department,
          sensitivityLevel: resource.sensitivityLevel,
          ownerId: resource.ownerId,
          requiresOnCampusAccess: resource.requiresOnCampusAccess,
        },
        action: action,
        environment: {
          ipAddress: req.context.ipAddress,
          accessLocation: req.context.location,
          userAgent: req.context.userAgent,
        },
      });

      res.json({
        success: true,
        resource: {
          id: resource.id,
          title: resource.title,
          type: resource.type,
          sensitivityLevel: resource.sensitivityLevel,
          department: resource.department,
        },
        user: {
          role: req.user.role,
          department: req.user.department,
          clearanceLevel: req.user.clearanceLevel,
        },
        environment: {
          location: req.context.location,
        },
        decision: decision,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ResourceController();