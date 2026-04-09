/* eslint-disable no-unused-vars */
/**
 * Credit Repository Interface
 * Defines contract for credit transactions and balance operations
 */

/**
 * @interface
 */
export class ICreditRepository {
    /**
     * Log a credit transaction
     * @param {import('../../domain/entities/CreditTransaction').CreditTransaction} transaction
     * @returns {Promise<void>}
     */
    async logTransaction(_transaction) {
        throw new Error('ICreditRepository.logTransaction() must be implemented');
    }

    /**
     * Get credit transaction history for a user
     * @param {string} userId - User ID
     * @param {number} [limit=50] - Maximum number of transactions to return
     * @returns {Promise<import('../../domain/entities/CreditTransaction').CreditTransaction[]>}
     */
    async getHistory(_userId, _limit = 50) {
        throw new Error('ICreditRepository.getHistory() must be implemented');
    }

    /**
     * Get current credit balance for a user
     * @param {string} userId - User ID
     * @returns {Promise<number>}
     */
    async getBalance(_userId) {
        throw new Error('ICreditRepository.getBalance() must be implemented');
    }
}
