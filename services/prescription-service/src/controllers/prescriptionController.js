const prescriptionService = require('../services/prescriptionService');
const logger = require('../../../../shared/logger');

/**
 * Upload prescription file
 * POST /api/prescriptions/upload
 * Form data: file (PDF/image)
 */
exports.uploadPrescription = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { medicine_id } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Prescription file is required',
        code: 'MISSING_FILE'
      });
    }

    // Validate file type
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: 'File must be PDF, JPEG, or PNG',
        code: 'INVALID_FILE_TYPE'
      });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        error: 'File size must be less than 5MB',
        code: 'FILE_TOO_LARGE'
      });
    }

    const prescription = await prescriptionService.uploadPrescription({
      userId,
      medicineId: medicine_id || null,
      fileName: req.file.filename,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      filePath: req.file.path
    });

    logger.info(`Prescription uploaded for user ${userId}`);

    res.status(201).json({
      success: true,
      data: prescription,
      message: 'Prescription uploaded successfully. Awaiting approval.'
    });
  } catch (error) {
    logger.error(`Error uploading prescription: ${error.message}`);
    next(error);
  }
};

/**
 * Get user's prescriptions
 * GET /api/prescriptions
 */
exports.getUserPrescriptions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status, limit, offset } = req.query;

    const result = await prescriptionService.getUserPrescriptions(userId, {
      status,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0
    });

    logger.info(`Retrieved ${result.prescriptions.length} prescriptions for user ${userId}`);

    res.json({
      success: true,
      data: result.prescriptions,
      count: result.prescriptions.length,
      total: result.total,
      page: Math.floor((offset || 0) / (limit || 50)) + 1
    });
  } catch (error) {
    logger.error(`Error fetching prescriptions: ${error.message}`);
    next(error);
  }
};

/**
 * Get specific prescription
 * GET /api/prescriptions/:prescriptionId
 */
exports.getPrescription = async (req, res, next) => {
  try {
    const { prescriptionId } = req.params;
    const userId = req.user.id;

    const prescription = await prescriptionService.getPrescription(prescriptionId);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        error: 'Prescription not found',
        code: 'PRESCRIPTION_NOT_FOUND'
      });
    }

    // Users can only view their own prescriptions (unless admin)
    if (req.user.role !== 'admin' && prescription.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view this prescription',
        code: 'FORBIDDEN'
      });
    }

    logger.info(`Retrieved prescription ${prescriptionId}`);

    res.json({
      success: true,
      data: prescription
    });
  } catch (error) {
    logger.error(`Error fetching prescription: ${error.message}`);
    next(error);
  }
};

/**
 * Approve prescription (pharmacist/admin only)
 * PUT /api/prescriptions/:prescriptionId/approve
 * Body: { approval_notes }
 */
exports.approvePrescription = async (req, res, next) => {
  try {
    const { prescriptionId } = req.params;
    const { approval_notes } = req.body;
    const pharmacistId = req.user.id;

    const prescription = await prescriptionService.approvePrescription(
      prescriptionId,
      pharmacistId,
      approval_notes
    );

    if (!prescription) {
      return res.status(404).json({
        success: false,
        error: 'Prescription not found or already processed',
        code: 'PRESCRIPTION_NOT_FOUND'
      });
    }

    logger.info(`Prescription approved by ${pharmacistId}: ${prescriptionId}`);

    res.json({
      success: true,
      data: prescription,
      message: 'Prescription approved successfully'
    });
  } catch (error) {
    logger.error(`Error approving prescription: ${error.message}`);
    
    if (error.message.includes('Only pending')) {
      return res.status(409).json({
        success: false,
        error: error.message,
        code: 'INVALID_STATUS'
      });
    }

    next(error);
  }
};

/**
 * Reject prescription (pharmacist/admin only)
 * PUT /api/prescriptions/:prescriptionId/reject
 * Body: { rejection_reason }
 */
exports.rejectPrescription = async (req, res, next) => {
  try {
    const { prescriptionId } = req.params;
    const { rejection_reason } = req.body;
    const pharmacistId = req.user.id;

    if (!rejection_reason) {
      return res.status(400).json({
        success: false,
        error: 'rejection_reason is required',
        code: 'MISSING_REASON'
      });
    }

    const prescription = await prescriptionService.rejectPrescription(
      prescriptionId,
      pharmacistId,
      rejection_reason
    );

    if (!prescription) {
      return res.status(404).json({
        success: false,
        error: 'Prescription not found or already processed',
        code: 'PRESCRIPTION_NOT_FOUND'
      });
    }

    logger.info(`Prescription rejected by ${pharmacistId}: ${prescriptionId}`);

    res.json({
      success: true,
      data: prescription,
      message: 'Prescription rejected'
    });
  } catch (error) {
    logger.error(`Error rejecting prescription: ${error.message}`);
    next(error);
  }
};

/**
 * Get all pending prescriptions (admin/pharmacist only)
 * GET /api/prescriptions/admin/pending
 */
exports.getPendingPrescriptions = async (req, res, next) => {
  try {
    const { limit, offset } = req.query;

    const result = await prescriptionService.getPendingPrescriptions({
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0
    });

    logger.info(`Retrieved ${result.prescriptions.length} pending prescriptions`);

    res.json({
      success: true,
      data: result.prescriptions,
      count: result.prescriptions.length,
      total: result.total,
      page: Math.floor((offset || 0) / (limit || 50)) + 1
    });
  } catch (error) {
    logger.error(`Error fetching pending prescriptions: ${error.message}`);
    next(error);
  }
};

/**
 * Check if user has valid prescription for medicine
 * POST /api/prescriptions/check-valid
 * Internal use by Order Service
 * Body: { user_id, medicine_ids }
 */
exports.checkValidPrescriptions = async (req, res, next) => {
  try {
    const { user_id, medicine_ids } = req.body;

    if (!user_id || !medicine_ids || !Array.isArray(medicine_ids)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request. Need user_id and medicine_ids array',
        code: 'INVALID_FORMAT'
      });
    }

    const result = await prescriptionService.checkValidPrescriptions(user_id, medicine_ids);

    logger.info(`Checked prescriptions for user ${user_id}`);

    res.json({
      success: true,
      data: result,
      allValid: result.valid_medicines.length === medicine_ids.length
    });
  } catch (error) {
    logger.error(`Error checking prescriptions: ${error.message}`);
    next(error);
  }
};

/**
 * Health check
 */
exports.health = (req, res) => {
  res.json({
    service: 'prescription-service',
    status: 'up',
    timestamp: new Date().toISOString()
  });
};
