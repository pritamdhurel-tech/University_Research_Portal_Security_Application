// Resource routes with ABAC enforcement

const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resource.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/abac.middleware');
const { validate, createResourceSchema, updateResourceSchema } = require('../utility/validators');
const resourceService = require('../services/resource.service');

// All resource routes require authentication
router.use(authenticate);

/**
 * GET /api/resources
 * List all accessible resources (ABAC filtered)
 */
router.get('/', resourceController.getResources);

/**
 * POST /api/resources
 * Create new resource (user becomes owner)
 */
router.post(
  '/',
  validate(createResourceSchema),
  resourceController.createResource
);

/**
 * GET /api/resources/:id
 * Get specific resource (ABAC check)
 */
router.get(
  '/:id',
  authorize({
    action: 'READ',
    getResource: async (req) => {
      const resource = await resourceService.getResourceById(req.params.id);
      return {
        id: resource.id,
        type: resource.type,
        department: resource.department,
        sensitivityLevel: resource.sensitivityLevel,
        ownerId: resource.ownerId,
        requiresOnCampusAccess: resource.requiresOnCampusAccess,
      };
    },
  }),
  resourceController.getResourceById
);

/**
 * PUT /api/resources/:id
 * Update resource (ABAC check - owner or admin)
 */
router.put(
  '/:id',
  validate(updateResourceSchema),
  authorize({
    action: 'EDIT',
    getResource: async (req) => {
      const resource = await resourceService.getResourceById(req.params.id);
      return {
        id: resource.id,
        type: resource.type,
        department: resource.department,
        sensitivityLevel: resource.sensitivityLevel,
        ownerId: resource.ownerId,
        requiresOnCampusAccess: resource.requiresOnCampusAccess,
      };
    },
  }),
  resourceController.updateResource
);

/**
 * DELETE /api/resources/:id
 * Delete resource (ABAC check - owner or admin)
 */
router.delete(
  '/:id',
  authorize({
    action: 'DELETE',
    getResource: async (req) => {
      const resource = await resourceService.getResourceById(req.params.id);
      return {
        id: resource.id,
        type: resource.type,
        department: resource.department,
        sensitivityLevel: resource.sensitivityLevel,
        ownerId: resource.ownerId,
        requiresOnCampusAccess: resource.requiresOnCampusAccess,
      };
    },
  }),
  resourceController.deleteResource
);

/**
 * GET /api/resources/:id/check-access
 * Test ABAC access to resource (debugging endpoint)
 */
router.get('/:id/check-access', resourceController.checkAccess);

module.exports = router;