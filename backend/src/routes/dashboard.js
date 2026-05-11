const express = require('express');
const { z } = require('zod');
const dashboardController = require('../controllers/dashboardController');
const logger = require('../utils/logger');

const router = express.Router();

// Middleware for request validation
const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (err) {
    logger.warn('Dashboard route validation error', { error: err.errors });
    res.status(400).json({ errors: err.errors });
  }
};

// Schema for PATCH /api/dashboard/queue/:id/resolve
const resolveQueueItemSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    decision: z.enum(['APPROVED', 'REJECTED']),
    reviewerNotes: z.string().optional(),
  }),
});

router.get('/stats', dashboardController.getStats);
router.get('/queue', dashboardController.getHumanReviewQueue);
router.patch('/queue/:id/resolve', validate(resolveQueueItemSchema), dashboardController.resolveHumanReviewItem);
router.get('/campaigns/:id/report', dashboardController.getCampaignReport);
router.get('/submissions/:id', dashboardController.getSubmissionDetails);

module.exports = router;
