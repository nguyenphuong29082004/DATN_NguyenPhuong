/* eslint-disable no-unused-vars */
/**
 * Prompt Repository Interface
 * Defines the contract for prompt data access
 */
export class IPromptRepository {
    /**
     * Find a prompt by ID
     * @param {string} id - Prompt ID
     * @returns {Promise<import('../../domain/entities/Prompt').Prompt|null>}
     */
    async findById(_id) {
        throw new Error('Not implemented');
    }

    /**
     * Find all prompts owned by a user
     * @param {string} userId - User ID
     * @param {Object} [options] - Optional pagination options
     * @param {number} [options.limit] - Maximum results
     * @param {number} [options.offset] - Offset for pagination
     * @returns {Promise<Array<import('../../domain/entities/Prompt').Prompt>>}
     */
    async findByUserId(_userId, _options = {}) {
        throw new Error('Not implemented');
    }

    /**
     * Find all public and system prompts
     * @param {Object} [options] - Optional pagination options
     * @param {number} [options.limit] - Maximum results
     * @param {number} [options.offset] - Offset for pagination
     * @returns {Promise<Array<import('../../domain/entities/Prompt').Prompt>>}
     */
    async findPublicAndSystem(_options = {}) {
        throw new Error('Not implemented');
    }

    /**
     * Save or update a prompt
     * @param {import('../../domain/entities/Prompt').Prompt} prompt - Prompt entity
     * @returns {Promise<void>}
     */
    async save(_prompt) {
        throw new Error('Not implemented');
    }

    /**
     * Create a new prompt
     * @param {import('../../domain/entities/Prompt').Prompt} prompt - Prompt entity
     * @returns {Promise<import('../../domain/entities/Prompt').Prompt>}
     */
    async create(_prompt) {
        throw new Error('Not implemented');
    }

    /**
     * Delete a prompt
     * @param {string} id - Prompt ID
     * @returns {Promise<void>}
     */
    async delete(_id) {
        throw new Error('Not implemented');
    }
}
