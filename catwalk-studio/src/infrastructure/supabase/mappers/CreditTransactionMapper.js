import { CreditTransaction } from '../../../domain/entities/CreditTransaction.js';

/**
 * CreditTransaction Mapper
 * Maps between database rows and CreditTransaction entities
 */
export class CreditTransactionMapper {
    /**
     * Convert database row to CreditTransaction entity
     * @param {Object} row - Database row from credit_transactions table
     * @returns {CreditTransaction} CreditTransaction entity
     */
    static toDomain(row) {
        if (!row) return null;

        const props = {
            userId: row.user_id,
            amount: row.amount,
            balanceAfter: row.balance_after,
            reason: row.reason,
            metadata: row.metadata || {},
            createdAt: row.created_at ? new Date(row.created_at) : new Date(),
        };

        return CreditTransaction.create(props, row.id);
    }

    /**
     * Convert CreditTransaction entity to database row
     * @param {CreditTransaction} transaction - CreditTransaction entity
     * @returns {Object} Database row for credit_transactions table
     */
    static toDatabase(transaction) {
        return {
            id: transaction.id,
            user_id: transaction.userId,
            amount: transaction.amount,
            balance_after: transaction.balanceAfter,
            reason: transaction.reason,
            metadata: transaction.metadata,
            created_at: transaction.createdAt.toISOString(),
        };
    }

    /**
     * Convert database row to DTO (for direct DTO mapping if needed)
     * @param {Object} row - Database row
     * @returns {Object} DTO-compatible object
     */
    static toDTO(row) {
        if (!row) return null;

        return {
            id: row.id,
            userId: row.user_id,
            amount: row.amount,
            balanceAfter: row.balance_after,
            reason: row.reason,
            metadata: row.metadata || {},
            createdAt: row.created_at ? new Date(row.created_at) : new Date(),
            type: row.amount >= 0 ? 'credit' : 'debit',
        };
    }
}
