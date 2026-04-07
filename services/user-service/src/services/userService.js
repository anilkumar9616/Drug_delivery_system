const userRepository = require('../repositories/userRepository');
const logger = require('../../../../shared/logger');

class UserService {
  /**
   * Get user profile (without password)
   */
  async getProfile(userId) {
    try {
      const user = await userRepository.findById(userId);
      
      if (!user) {
        return null;
      }

      // Remove sensitive data
      delete user.password_hash;
      
      return user;
    } catch (error) {
      logger.error(`UserService.getProfile error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, updates) {
    try {
      // Only allow updating name and phone
      const allowedUpdates = {};
      
      if (updates.name !== undefined) {
        allowedUpdates.name = updates.name;
      }
      
      if (updates.phone !== undefined) {
        allowedUpdates.phone = updates.phone;
      }

      if (Object.keys(allowedUpdates).length === 0) {
        return this.getProfile(userId);
      }

      await userRepository.update(userId, allowedUpdates);
      
      return this.getProfile(userId);
    } catch (error) {
      logger.error(`UserService.updateProfile error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all addresses for user
   */
  async getAddresses(userId) {
    try {
      return await userRepository.getAddresses(userId);
    } catch (error) {
      logger.error(`UserService.getAddresses error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Add new address
   */
  async addAddress(userId, addressData) {
    try {
      // Verify user exists
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // If this is the first address, make it default
      const addresses = await userRepository.getAddresses(userId);
      const isFirst = addresses.length === 0;

      const address = await userRepository.createAddress(userId, {
        ...addressData,
        is_default: isFirst || addressData.is_default
      });

      return address;
    } catch (error) {
      logger.error(`UserService.addAddress error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update specific address
   */
  async updateAddress(userId, addressId, updates) {
    try {
      // Verify address belongs to user
      const address = await userRepository.getAddressById(addressId);
      
      if (!address || address.user_id !== userId) {
        return null;
      }

      // Build update object with only provided fields
      const updateData = {};
      if (updates.street !== undefined) updateData.street = updates.street;
      if (updates.city !== undefined) updateData.city = updates.city;
      if (updates.state !== undefined) updateData.state = updates.state;
      if (updates.postal_code !== undefined) updateData.postal_code = updates.postal_code;
      if (updates.country !== undefined) updateData.country = updates.country;

      await userRepository.updateAddress(addressId, updateData);
      
      return userRepository.getAddressById(addressId);
    } catch (error) {
      logger.error(`UserService.updateAddress error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete address
   */
  async deleteAddress(userId, addressId) {
    try {
      // Verify address belongs to user
      const address = await userRepository.getAddressById(addressId);
      
      if (!address || address.user_id !== userId) {
        return false;
      }

      // Don't allow deleting if it's the only address
      const addresses = await userRepository.getAddresses(userId);
      if (addresses.length === 1) {
        throw new Error('Cannot delete the only address. Add another address first.');
      }

      // If deleting default address, set first other address as default
      if (address.is_default) {
        const otherAddress = addresses.find(a => a.id !== addressId);
        if (otherAddress) {
          await userRepository.updateAddress(otherAddress.id, { is_default: true });
        }
      }

      await userRepository.deleteAddress(addressId);
      
      return true;
    } catch (error) {
      logger.error(`UserService.deleteAddress error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Set address as default
   */
  async setDefaultAddress(userId, addressId) {
    try {
      // Verify address belongs to user
      const address = await userRepository.getAddressById(addressId);
      
      if (!address || address.user_id !== userId) {
        return null;
      }

      // Get all user addresses
      const addresses = await userRepository.getAddresses(userId);

      // Update all addresses for this user
      for (const addr of addresses) {
        await userRepository.updateAddress(addr.id, {
          is_default: addr.id === addressId
        });
      }

      return userRepository.getAddressById(addressId);
    } catch (error) {
      logger.error(`UserService.setDefaultAddress error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user with addresses (admin/internal)
   */
  async getUserWithAddresses(userId) {
    try {
      const user = await this.getProfile(userId);
      if (!user) return null;

      const addresses = await userRepository.getAddresses(userId);
      
      return {
        ...user,
        addresses
      };
    } catch (error) {
      logger.error(`UserService.getUserWithAddresses error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if user exists
   */
  async userExists(userId) {
    try {
      const user = await userRepository.findById(userId);
      return !!user;
    } catch (error) {
      logger.error(`UserService.userExists error: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new UserService();
