/* eslint-disable no-unused-vars */
/**
 * User Repository Interface
 * Defines contract for user data access operations
 */

/**
 * @typedef {Object} IUserRepository
 * @property {function(string): Promise<import('../../domain/entities/User').User|null>} findById - Find user by ID
 * @property {function(import('../../domain/entities/User').User): Promise<void>} save - Save or update user
 * @property {function(Object): Promise<import('../../domain/entities/User').User>} create - Create new user
 */

/**
 * User Repository Interface
 * @interface
 */
export class IUserRepository {
    /**
     * Find a user by ID
     * @param {string} id - User ID
     * @returns {Promise<import('../../domain/entities/User').User|null>}
     */
    async findById(_id) {
        throw new Error('IUserRepository.findById() must be implemented');
    }

    /**
     * Save or update a user
     * @param {import('../../domain/entities/User').User} user - User entity to save
     * @returns {Promise<void>}
     */
    async save(_user) {
        throw new Error('IUserRepository.save() must be implemented');
    }

    /**
     * Create a new user
     * @param {Object} userData - User data
     * @returns {Promise<import('../../domain/entities/User').User>}
     */
    async create(_userData) {
        throw new Error('IUserRepository.create() must be implemented');
    }
}
