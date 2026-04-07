const medicineService = require('../services/medicineService');
const logger = require('../../../../shared/logger');

/**
 * Get all medicines (cached)
 * GET /api/medicines
 */
exports.getAllMedicines = async (req, res, next) => {
  try {
    const medicines = await medicineService.getAllMedicines();
    
    logger.info(`Retrieved ${medicines.length} medicines`);
    
    res.json({
      success: true,
      data: medicines,
      count: medicines.length
    });
  } catch (error) {
    logger.error(`Error fetching medicines: ${error.message}`);
    next(error);
  }
};

/**
 * Get single medicine by ID (cached)
 * GET /api/medicines/:id
 */
exports.getMedicineById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const medicine = await medicineService.getMedicineById(id);
    
    if (!medicine) {
      return res.status(404).json({
        success: false,
        error: 'Medicine not found',
        code: 'MEDICINE_NOT_FOUND'
      });
    }

    logger.info(`Retrieved medicine ${id}`);
    
    res.json({
      success: true,
      data: medicine
    });
  } catch (error) {
    logger.error(`Error fetching medicine: ${error.message}`);
    next(error);
  }
};

/**
 * Search medicines with filters
 * GET /api/medicines/search?name=paracetamol&requires_prescription=false&inStock=true
 */
exports.searchMedicines = async (req, res, next) => {
  try {
    const { name, requires_prescription, inStock, minPrice, maxPrice, limit, offset } = req.query;

    const filters = {
      name: name ? name.trim() : undefined,
      requires_prescription: requires_prescription ? requires_prescription === 'true' : undefined,
      inStock: inStock ? inStock === 'true' : undefined,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0
    };

    const result = await medicineService.searchMedicines(filters);
    
    logger.info(`Medicine search completed with ${result.medicines.length} results`);
    
    res.json({
      success: true,
      data: result.medicines,
      count: result.medicines.length,
      total: result.total,
      page: Math.floor(filters.offset / filters.limit) + 1,
      pageSize: filters.limit
    });
  } catch (error) {
    logger.error(`Error searching medicines: ${error.message}`);
    next(error);
  }
};

/**
 * Create new medicine (admin/pharmacist only)
 * POST /api/medicines
 */
exports.createMedicine = async (req, res, next) => {
  try {
    const { name, description, price, quantity_in_stock, requires_prescription, manufacturer, batch_number, expiry_date } = req.body;

    // Validation
    if (!name || !price || quantity_in_stock === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, price, quantity_in_stock',
        code: 'MISSING_FIELDS'
      });
    }

    if (price <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Price must be greater than 0',
        code: 'INVALID_PRICE'
      });
    }

    if (quantity_in_stock < 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantity cannot be negative',
        code: 'INVALID_QUANTITY'
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Medicine name must be at least 2 characters',
        code: 'INVALID_NAME'
      });
    }

    const medicine = await medicineService.createMedicine({
      name: name.trim(),
      description: description ? description.trim() : null,
      price: parseFloat(price),
      quantity_in_stock: parseInt(quantity_in_stock, 10),
      requires_prescription: requires_prescription === true || requires_prescription === 'true',
      manufacturer: manufacturer ? manufacturer.trim() : null,
      batch_number: batch_number ? batch_number.trim() : null,
      expiry_date
    });

    logger.info(`Medicine created: ${medicine.id} - ${medicine.name}`);
    
    res.status(201).json({
      success: true,
      data: medicine,
      message: 'Medicine created successfully'
    });
  } catch (error) {
    logger.error(`Error creating medicine: ${error.message}`);
    next(error);
  }
};

/**
 * Update medicine (admin/pharmacist only)
 * PUT /api/medicines/:id
 */
exports.updateMedicine = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate update fields
    if (updates.price !== undefined && updates.price <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Price must be greater than 0',
        code: 'INVALID_PRICE'
      });
    }

    if (updates.quantity_in_stock !== undefined && updates.quantity_in_stock < 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantity cannot be negative',
        code: 'INVALID_QUANTITY'
      });
    }

    if (updates.name !== undefined && updates.name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Medicine name must be at least 2 characters',
        code: 'INVALID_NAME'
      });
    }

    const medicine = await medicineService.updateMedicine(id, updates);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        error: 'Medicine not found',
        code: 'MEDICINE_NOT_FOUND'
      });
    }

    logger.info(`Medicine updated: ${id}`);
    
    res.json({
      success: true,
      data: medicine,
      message: 'Medicine updated successfully'
    });
  } catch (error) {
    logger.error(`Error updating medicine: ${error.message}`);
    next(error);
  }
};

/**
 * Delete medicine (admin only)
 * DELETE /api/medicines/:id
 */
exports.deleteMedicine = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deleted = await medicineService.deleteMedicine(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Medicine not found',
        code: 'MEDICINE_NOT_FOUND'
      });
    }

    logger.info(`Medicine deleted: ${id}`);
    
    res.json({
      success: true,
      message: 'Medicine deleted successfully'
    });
  } catch (error) {
    logger.error(`Error deleting medicine: ${error.message}`);
    next(error);
  }
};

/**
 * Check stock for multiple medicines
 * POST /api/medicines/check-stock
 * Internal use (called by Order Service)
 */
exports.checkStock = async (req, res, next) => {
  try {
    const { items } = req.body; // [{ medicine_id, quantity }, ...]

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request format. Expected items array',
        code: 'INVALID_FORMAT'
      });
    }

    const available = await medicineService.checkStock(items);

    logger.info(`Stock checked for ${items.length} medicines`);
    
    res.json({
      success: true,
      data: available,
      allAvailable: available.every(item => item.available)
    });
  } catch (error) {
    logger.error(`Error checking stock: ${error.message}`);
    next(error);
  }
};

/**
 * Reserve stock for an order (atomic operation)
 * POST /api/medicines/reserve-stock
 * Internal use (called by Order Service)
 */
exports.reserveStock = async (req, res, next) => {
  try {
    const { order_id, items, reservation_duration_minutes } = req.body;

    if (!order_id || !items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: order_id, items',
        code: 'MISSING_FIELDS'
      });
    }

    const reserved = await medicineService.reserveStock(
      order_id,
      items,
      reservation_duration_minutes || 15
    );

    logger.info(`Stock reserved for order ${order_id}`);
    
    res.json({
      success: true,
      data: reserved,
      message: 'Stock reserved successfully'
    });
  } catch (error) {
    logger.error(`Error reserving stock: ${error.message}`);
    next(error);
  }
};

/**
 * Release reserved stock
 * POST /api/medicines/release-stock
 * Internal use (called by Order Service on cancellation)
 */
exports.releaseStock = async (req, res, next) => {
  try {
    const { order_id } = req.body;

    if (!order_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: order_id',
        code: 'MISSING_FIELDS'
      });
    }

    const released = await medicineService.releaseStock(order_id);

    logger.info(`Stock released for order ${order_id}`);
    
    res.json({
      success: true,
      message: 'Stock released successfully'
    });
  } catch (error) {
    logger.error(`Error releasing stock: ${error.message}`);
    next(error);
  }
};

/**
 * Health check
 */
exports.health = (req, res) => {
  res.json({
    service: 'medicine-service',
    status: 'up',
    timestamp: new Date().toISOString()
  });
};
