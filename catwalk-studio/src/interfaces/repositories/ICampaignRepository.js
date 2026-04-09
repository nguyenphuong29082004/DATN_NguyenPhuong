/* eslint-disable no-unused-vars */
/**
 * Campaign Repository Interface
 * Defines the contract for campaign data access
 */
export class ICampaignRepository {
    /**
     * Find a campaign by ID
     * @param {string} id - Campaign ID
     * @returns {Promise<import('../../domain/entities/Campaign').Campaign|null>}
     */
    async findById(_id) {
        throw new Error('Not implemented');
    }

    /**
     * Find all campaigns by user ID
     * @param {string} userId - User ID
     * @param {Object} [options] - Optional filters
     * @param {string} [options.status] - Filter by status
     * @returns {Promise<Array<import('../../domain/entities/Campaign').Campaign>>}
     */
    async findByUserId(_userId, _options = {}) {
        throw new Error('Not implemented');
    }

    /**
     * Create a new campaign
     * @param {import('../../domain/entities/Campaign').Campaign} campaign - Campaign entity
     * @returns {Promise<import('../../domain/entities/Campaign').Campaign>}
     */
    async create(_campaign) {
        throw new Error('Not implemented');
    }

    /**
     * Save or update a campaign
     * @param {import('../../domain/entities/Campaign').Campaign} campaign - Campaign entity
     * @returns {Promise<void>}
     */
    async save(_campaign) {
        throw new Error('Not implemented');
    }

    /**
     * Delete a campaign
     * @param {string} id - Campaign ID
     * @returns {Promise<void>}
     */
    async delete(_id) {
        throw new Error('Not implemented');
    }
}
