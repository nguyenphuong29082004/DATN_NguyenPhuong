/* eslint-disable no-unused-vars */
/**
 * Wardrobe Repository Interface
 * Defines the contract for wardrobe item data access
 */
export class IWardrobeRepository {
    /**
     * Find a wardrobe item by ID
     * @param {string} id - Wardrobe item ID
     * @returns {Promise<import('../../domain/entities/WardrobeItem').WardrobeItem|null>}
     */
    async findById(_id) {
        throw new Error('Not implemented');
    }

    /**
     * Find all wardrobe items owned by a user
     * @param {string} userId - User ID
     * @param {Object} [options] - Optional filters and pagination
     * @param {string[]} [options.categories] - Category filters
     * @param {number} [options.limit] - Maximum results
     * @param {number} [options.offset] - Offset for pagination
     * @returns {Promise<Array<import('../../domain/entities/WardrobeItem').WardrobeItem>>}
     */
    async findByUserId(_userId, _options = {}) {
        throw new Error('Not implemented');
    }

    /**
     * Find all public and default wardrobe items
     * @param {Object} [options] - Optional filters and pagination
     * @param {string[]} [options.categories] - Category filters
     * @param {number} [options.limit] - Maximum results
     * @param {number} [options.offset] - Offset for pagination
     * @returns {Promise<Array<import('../../domain/entities/WardrobeItem').WardrobeItem>>}
     */
    async findPublicAndDefault(_options = {}) {
        throw new Error('Not implemented');
    }

    /**
     * Create a new wardrobe item
     * @param {import('../../domain/entities/WardrobeItem').WardrobeItem} wardrobeItem - WardrobeItem entity
     * @returns {Promise<import('../../domain/entities/WardrobeItem').WardrobeItem>}
     */
    async create(_wardrobeItem) {
        throw new Error('Not implemented');
    }

    /**
     * Save or update a wardrobe item
     * @param {import('../../domain/entities/WardrobeItem').WardrobeItem} wardrobeItem - WardrobeItem entity
     * @returns {Promise<void>}
     */
    async save(_wardrobeItem) {
        throw new Error('Not implemented');
    }

    /**
     * Delete a wardrobe item
     * @param {string} id - Wardrobe item ID
     * @returns {Promise<void>}
     */
    async delete(_id) {
        throw new Error('Not implemented');
    }

    async findShootableItems(_userId, _offset, _limit, _search) {
        throw new Error('Not implemented');
    }
}
