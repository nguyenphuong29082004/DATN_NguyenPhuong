/* eslint-disable no-unused-vars */
/**
 * AI Model Repository Interface
 * Defines the contract for AI model data access
 */
export class IAIModelRepository {
    /**
     * Find a model by ID
     * @param {string} id - Model ID
     * @returns {Promise<import('../../domain/entities/AIModel').AIModel|null>}
     */
    async findById(_id) {
        throw new Error('Not implemented');
    }

    /**
     * Find all models owned by a user
     * @param {string} userId - User ID
     * @returns {Promise<Array<import('../../domain/entities/AIModel').AIModel>>}
     */
    async findByUserId(_userId) {
        throw new Error('Not implemented');
    }

    /**
     * Find all public models (optionally filtered)
     * @param {Object} [filters] - Optional filters
     * @param {string} [filters.gender] - Gender filter
     * @param {string} [filters.ethnicity] - Ethnicity filter
     * @param {Array<string>} [filters.tags] - Tags filter
     * @param {number} [filters.limit] - Maximum results
     * @returns {Promise<Array<import('../../domain/entities/AIModel').AIModel>>}
     */
    async findPublic(_filters = {}) {
        throw new Error('Not implemented');
    }

    /**
     * Save or update a model
     * @param {import('../../domain/entities/AIModel').AIModel} model - Model entity
     * @returns {Promise<void>}
     */
    async save(_model) {
        throw new Error('Not implemented');
    }

    /**
     * Create a new model
     * @param {import('../../domain/entities/AIModel').AIModel} model - Model entity
     * @returns {Promise<import('../../domain/entities/AIModel').AIModel>}
     */
    async create(_model) {
        throw new Error('Not implemented');
    }

    /**
     * Delete a model
     * @param {string} id - Model ID
     * @returns {Promise<void>}
     */
    async delete(_id) {
        throw new Error('Not implemented');
    }

    /**
     * Find user's AI characters for Quick Shoot
     * @param {string} userId - User ID
     * @returns {Promise<Array<Object>>} Mapped character objects
     */
    async findUserCharacters(_userId) {
        throw new Error('Not implemented');
    }
}
