const medicineRepository = require('../repositories/medicineRepository');
const redis = require('redis');
const logger = require('../../../../shared/logger');

// Redis client for caching
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

redisClient.on('error', (err) => {
  logger.error(`Redis error: ${err.message}`);
});

redisClient.connect().catch((err) => {
  logger.error(`Failed to connect to Redis: ${err.message}`);
});

// Cache keys
const CACHE_KEYS = {
  ALL_MEDICINES: 'medicines:all',
  MEDICINE: (id) => `medicine:${id}`,
  SEARCH: (query) => `medicines:search:${JSON.stringify(query)}`,
};

const CACHE_DURATIONS = {
  ALL_MEDICINES: 3600, // 1 hour
  SINGLE_MEDICINE: 1800, // 30 minutes
  SEARCH: 1200, // 20 minutes
};

class MedicineService {
  /**
   * Get all medicines with caching
   */
  async getAllMedicines() {
    try {
      // Try to get from cache
      const cached = await redisClient.get(CACHE_KEYS.ALL_MEDICINES);
      
      if (cached) {
        logger.debug('Returning medicines from cache');
        return JSON.parse(cached);
      }

      // Get from database
      const medicines = await medicineRepository.findAll();

      // Cache for 1 hour
      await redisClient.setEx(
        CACHE_KEYS.ALL_MEDICINES,
        CACHE_DURATIONS.ALL_MEDICINES,
        JSON.stringify(medicines)
      );

      return medicines;
    } catch (error) {
      logger.error(`MedicineService.getAllMedicines error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get single medicine with caching
   */
  async getMedicineById(medicineId) {
    try {
      const cacheKey = CACHE_KEYS.MEDICINE(medicineId);

      // Try to get from cache
      const cached = await redisClient.get(cacheKey);
      
      if (cached) {
        logger.debug(`Medicine ${medicineId} from cache`);
        return JSON.parse(cached);
      }

      // Get from database
      const medicine = await medicineRepository.findById(medicineId);

      if (medicine) {
        // Cache for 30 minutes
        await redisClient.setEx(
          cacheKey,
          CACHE_DURATIONS.SINGLE_MEDICINE,
          JSON.stringify(medicine)
        );
      }

      return medicine;
    } catch (error) {
      logger.error(`MedicineService.getMedicineById error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Search medicines with filters
   */
  async searchMedicines(filters) {
    try {
      const cacheKey = CACHE_KEYS.SEARCH(filters);

      // Try to get from cache (only for non-paginated searches)
      if (filters.offset === 0 || filters.offset === undefined) {
        const cached = await redisClient.get(cacheKey);
        
        if (cached) {
          logger.debug('Medicine search results from cache');
          return JSON.parse(cached);
        }
      }

      // Search database
      const result = await medicineRepository.search(filters);

      // Cache search results
      if (filters.offset === 0 || filters.offset === undefined) {
        await redisClient.setEx(
          cacheKey,
          CACHE_DURATIONS.SEARCH,
          JSON.stringify(result)
        );
      }

      return result;
    } catch (error) {
      logger.error(`MedicineService.searchMedicines error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create new medicine
   */
  async createMedicine(medicineData) {
    try {
      const medicine = await medicineRepository.create(medicineData);

      // Invalidate all medicines cache
      await redisClient.del(CACHE_KEYS.ALL_MEDICINES);
      
      logger.info(`Medicine created: ${medicine.id}`);

      return medicine;
    } catch (error) {
      logger.error(`MedicineService.createMedicine error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update medicine
   */
  async updateMedicine(medicineId, updates) {
    try {
      const medicine = await medicineRepository.update(medicineId, updates);

      if (medicine) {
        // Invalidate cache for this medicine and all medicines
        const cacheKey = CACHE_KEYS.MEDICINE(medicineId);
        await redisClient.del(cacheKey);
        await redisClient.del(CACHE_KEYS.ALL_MEDICINES);
        
        logger.info(`Medicine updated: ${medicineId}`);
      }

      return medicine;
    } catch (error) {
      logger.error(`MedicineService.updateMedicine error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete medicine
   */
  async deleteMedicine(medicineId) {
    try {
      const deleted = await medicineRepository.delete(medicineId);

      if (deleted) {
        // Invalidate cache
        const cacheKey = CACHE_KEYS.MEDICINE(medicineId);
        await redisClient.del(cacheKey);
        await redisClient.del(CACHE_KEYS.ALL_MEDICINES);
        
        logger.info(`Medicine deleted: ${medicineId}`);
      }

      return deleted;
    } catch (error) {
      logger.error(`MedicineService.deleteMedicine error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check stock availability for items
   */
  async checkStock(items) {
    try {
      const available = [];

      for (const item of items) {
        const medicine = await this.getMedicineById(item.medicine_id);

        available.push({
          medicine_id: item.medicine_id,
          requested_quantity: item.quantity,
          available_quantity: medicine ? medicine.quantity_in_stock : 0,
          available: medicine && medicine.quantity_in_stock >= item.quantity,
          medicine_name: medicine ? medicine.name : null
        });
      }

      return available;
    } catch (error) {
      logger.error(`MedicineService.checkStock error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Reserve stock for an order (atomic operation)
   */
  async reserveStock(orderId, items, durationMinutes = 15) {
    try {
      // Check stock first
      const availability = await this.checkStock(items);
      
      if (!availability.every(item => item.available)) {
        throw new Error('Insufficient stock for one or more items');
      }

      // Reserve stock in database
      const reservations = await medicineRepository.reserveStock(
        orderId,
        items,
        durationMinutes
      );

      logger.info(`Stock reserved for order ${orderId}`);

      return reservations;
    } catch (error) {
      logger.error(`MedicineService.reserveStock error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Release reserved stock
   */
  async releaseStock(orderId) {
    try {
      const released = await medicineRepository.releaseStock(orderId);

      logger.info(`Stock released for order ${orderId}`);

      return released;
    } catch (error) {
      logger.error(`MedicineService.releaseStock error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get medicines requiring prescription
   */
  async getMedicinesRequiringPrescription() {
    try {
      return await medicineRepository.findByPrescriptionRequired(true);
    } catch (error) {
      logger.error(`MedicineService.getMedicinesRequiringPrescription error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update stock (after successful payment)
   */
  async updateStock(medicineId, quantityChange) {
    try {
      await medicineRepository.updateStock(medicineId, quantityChange);

      // Invalidate cache
      const cacheKey = CACHE_KEYS.MEDICINE(medicineId);
      await redisClient.del(cacheKey);
      await redisClient.del(CACHE_KEYS.ALL_MEDICINES);

      logger.info(`Stock updated for medicine ${medicineId} by ${quantityChange}`);
    } catch (error) {
      logger.error(`MedicineService.updateStock error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clear all caches (admin/debug operation)
   */
  async clearCache() {
    try {
      await redisClient.flushDb();
      logger.info('All medicine caches cleared');
    } catch (error) {
      logger.error(`MedicineService.clearCache error: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new MedicineService();
