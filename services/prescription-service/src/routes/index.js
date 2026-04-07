const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');
const authenticateToken = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and images (JPEG/PNG) are allowed.'));
    }
  }
});

// Health check
router.get('/health', prescriptionController.health);

// User operations (protected)
router.post('/upload', authenticateToken, upload.single('prescription_file'), prescriptionController.uploadPrescription);
router.get('/', authenticateToken, prescriptionController.getUserPrescriptions);
router.get('/:id', authenticateToken, prescriptionController.getPrescription);

// Admin/Pharmacist operations (protected)
router.get('/pending/all', authenticateToken, prescriptionController.getPendingPrescriptions);
router.put('/:id/approve', authenticateToken, prescriptionController.approvePrescription);
router.put('/:id/reject', authenticateToken, prescriptionController.rejectPrescription);

// Internal endpoint (called by Order Service)
router.post('/check/valid', prescriptionController.checkValidPrescriptions);

module.exports = router;
