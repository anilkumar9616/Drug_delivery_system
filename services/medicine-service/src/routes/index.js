const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineController');
const { authenticateToken, authorize } = require('../middleware/auth');

/**
 * Health check endpoint
 */
router.get('/health', medicineController.health);

/**
 * Public endpoints (no auth required)
 */

// Search medicines (must come before /:id to avoid matching as id parameter)
router.get('/search', medicineController.searchMedicines);

// Get all medicines (cached)
router.get('/', medicineController.getAllMedicines);

// Get single medicine (cached)
router.get('/:id', medicineController.getMedicineById);

/**
 * Admin/Pharmacist endpoints
 */

// Create new medicine
router.post(
  '/',
  authenticateToken,
  authorize('admin', 'pharmacist'),
  medicineController.createMedicine
);

// Update medicine
router.put(
  '/:id',
  authenticateToken,
  authorize('admin', 'pharmacist'),
  medicineController.updateMedicine
);

// Delete medicine (admin only)
router.delete(
  '/:id',
  authenticateToken,
  authorize('admin'),
  medicineController.deleteMedicine
);

/**
 * Internal endpoints (called by Order Service)
 */

// Check stock availability
router.post('/internal/check-stock', medicineController.checkStock);

// Reserve stock for order
router.post('/internal/reserve-stock', medicineController.reserveStock);

// Release reserved stock
router.post('/internal/release-stock', medicineController.releaseStock);

module.exports = router;
