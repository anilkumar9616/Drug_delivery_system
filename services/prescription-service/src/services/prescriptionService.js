const prescriptionRepository = require('../repositories/prescriptionRepository');
const logger = require('../../../../shared/logger');

class PrescriptionService {
  /**
   * Upload new prescription
   */
  async uploadPrescription(prescriptionData) {
    try {
      const prescription = await prescriptionRepository.create({
        user_id: prescriptionData.userId,
        file_url: prescriptionData.filePath,
        status: 'pending',
        medicine_id: prescriptionData.medicineId || null,
        file_name: prescriptionData.fileName,
        file_size: prescriptionData.fileSize,
        mime_type: prescriptionData.mimeType
      });

      logger.info(`Prescription created: ${prescription.id} for user ${prescriptionData.userId}`);

      return {
        id: prescription.id,
        user_id: prescription.user_id,
        status: prescription.status,
        medicine_id: prescription.medicine_id,
        file_url: prescription.file_url,
        created_at: prescription.created_at,
        updated_at: prescription.updated_at
      };
    } catch (error) {
      logger.error(`PrescriptionService.uploadPrescription error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user's prescriptions
   */
  async getUserPrescriptions(userId, filters = {}) {
    try {
      return await prescriptionRepository.findByUserId(userId, filters);
    } catch (error) {
      logger.error(`PrescriptionService.getUserPrescriptions error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get single prescription
   */
  async getPrescription(prescriptionId) {
    try {
      return await prescriptionRepository.findById(prescriptionId);
    } catch (error) {
      logger.error(`PrescriptionService.getPrescription error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Approve prescription
   */
  async approvePrescription(prescriptionId, pharmacistId, approvalNotes) {
    try {
      // Get prescription
      const prescription = await prescriptionRepository.findById(prescriptionId);

      if (!prescription) {
        return null;
      }

      // Only pending prescriptions can be approved
      if (prescription.status !== 'pending') {
        throw new Error(`Only pending prescriptions can be approved. Current status: ${prescription.status}`);
      }

      // Update prescription
      const updated = await prescriptionRepository.updateStatus(
        prescriptionId,
        'approved',
        pharmacistId,
        approvalNotes,
        new Date()
      );

      logger.info(`Prescription approved: ${prescriptionId} by pharmacist ${pharmacistId}`);

      return updated;
    } catch (error) {
      logger.error(`PrescriptionService.approvePrescription error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Reject prescription
   */
  async rejectPrescription(prescriptionId, pharmacistId, rejectionReason) {
    try {
      // Get prescription
      const prescription = await prescriptionRepository.findById(prescriptionId);

      if (!prescription) {
        return null;
      }

      // Only pending prescriptions can be rejected
      if (prescription.status !== 'pending') {
        throw new Error(`Only pending prescriptions can be rejected. Current status: ${prescription.status}`);
      }

      // Update prescription
      const updated = await prescriptionRepository.updateStatus(
        prescriptionId,
        'rejected',
        pharmacistId,
        rejectionReason,
        new Date()
      );

      logger.info(`Prescription rejected: ${prescriptionId} by pharmacist ${pharmacistId}`);

      return updated;
    } catch (error) {
      logger.error(`PrescriptionService.rejectPrescription error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all pending prescriptions (admin/pharmacist)
   */
  async getPendingPrescriptions(filters = {}) {
    try {
      return await prescriptionRepository.findByStatus('pending', filters);
    } catch (error) {
      logger.error(`PrescriptionService.getPendingPrescriptions error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if user has valid prescription for medicines
   */
  async checkValidPrescriptions(userId, medicineIds) {
    try {
      const prescriptions = await prescriptionRepository.findApprovedByUserId(userId);

      // Get approved medicines for this user
      const approvedMedicines = prescriptions
        .filter(p => p.medicine_id && p.status === 'approved')
        .map(p => p.medicine_id);

      // Check which medicines have valid prescriptions
      const validMedicines = medicineIds.filter(id => approvedMedicines.includes(id));

      return {
        user_id: userId,
        requested_medicines: medicineIds,
        valid_medicines: validMedicines,
        invalid_medicines: medicineIds.filter(id => !validMedicines.includes(id)),
        all_valid: validMedicines.length === medicineIds.length
      };
    } catch (error) {
      logger.error(`PrescriptionService.checkValidPrescriptions error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get prescription expiry status
   */
  async getPrescriptionExpiryStatus(prescriptionId) {
    try {
      const prescription = await prescriptionRepository.findById(prescriptionId);

      if (!prescription) {
        return null;
      }

      // Prescriptions typically valid for 1 year from approval
      const approvalDate = new Date(prescription.approval_date);
      const expiryDate = new Date(approvalDate);
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);

      const now = new Date();
      const isExpired = now > expiryDate;
      const daysUntilExpiry = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));

      return {
        id: prescription.id,
        status: prescription.status,
        approval_date: prescription.approval_date,
        expiry_date: expiryDate,
        is_expired: isExpired,
        days_until_expiry: daysUntilExpiry
      };
    } catch (error) {
      logger.error(`PrescriptionService.getPrescriptionExpiryStatus error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get statistics (admin)
   */
  async getStatistics() {
    try {
      return await prescriptionRepository.getStats();
    } catch (error) {
      logger.error(`PrescriptionService.getStatistics error: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new PrescriptionService();
