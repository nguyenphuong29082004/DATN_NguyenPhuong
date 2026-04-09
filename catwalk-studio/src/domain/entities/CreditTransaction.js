import { Entity } from './Entity.js';

/**
 * CreditTransaction Domain Entity
 * Represents a credit transaction in the system
 * 
 * Business Rules:
 * - Transaction amount can be positive (addition) or negative (deduction)
 * - Balance after transaction must be >= 0
 * - Reason must be provided for all transactions
 */
export class CreditTransaction extends Entity {
    /**
     * Create a CreditTransaction entity
     * @param {Object} props - Transaction properties
     * @param {string} props.userId - User ID
     * @param {number} props.amount - Transaction amount (positive for credit, negative for debit)
     * @param {number} props.balanceAfter - Balance after transaction
     * @param {string} props.reason - Reason for transaction
     * @param {Object} [props.metadata] - Additional metadata (e.g., generationId, campaignId)
     * @param {Date} [props.createdAt] - Transaction timestamp
     * @param {string} [id] - Transaction ID
     */
    constructor(props, id) {
        super(props, id);
        this.validate();
    }

    /**
     * Factory method to create a CreditTransaction
     * @param {Object} props - Transaction properties
     * @param {string} [id] - Optional ID
     * @returns {CreditTransaction}
     */
    static create(props, id) {
        const defaultProps = {
            metadata: {},
            createdAt: new Date(),
            ...props
        };

        return new CreditTransaction(defaultProps, id);
    }

    /**
     * Validate transaction properties
     * @throws {Error} If validation fails
     */
    validate() {
        if (!this.props.userId) {
            throw new Error('User ID is required');
        }

        if (typeof this.props.amount !== 'number') {
            throw new Error('Amount must be a number');
        }

        if (typeof this.props.balanceAfter !== 'number' || this.props.balanceAfter < 0) {
            throw new Error('Balance after transaction cannot be negative');
        }

        if (!this.props.reason || this.props.reason.trim() === '') {
            throw new Error('Reason is required for all transactions');
        }
    }

    // ========================================================
    // Getters
    // ========================================================

    get userId() {
        return this.props.userId;
    }

    get amount() {
        return this.props.amount;
    }

    get balanceAfter() {
        return this.props.balanceAfter;
    }

    get reason() {
        return this.props.reason;
    }

    get metadata() {
        return this.props.metadata;
    }

    get createdAt() {
        return this.props.createdAt;
    }

    // ========================================================
    // Business Logic Methods
    // ========================================================

    /**
     * Check if this is a deduction (negative amount)
     * @returns {boolean}
     */
    isDeduction() {
        return this.props.amount < 0;
    }

    /**
     * Check if this is an addition (positive amount)
     * @returns {boolean}
     */
    isAddition() {
        return this.props.amount > 0;
    }

    /**
     * Get absolute amount (without sign)
     * @returns {number}
     */
    getAbsoluteAmount() {
        return Math.abs(this.props.amount);
    }

    /**
     * Get transaction type as string
     * @returns {string} 'credit' or 'debit'
     */
    getTransactionType() {
        return this.isAddition() ? 'credit' : 'debit';
    }

    /**
     * Check if transaction is related to a specific feature
     * @param {string} feature - Feature name (e.g., 'generation', 'campaign')
     * @returns {boolean}
     */
    isRelatedTo(feature) {
        return this.props.reason.toLowerCase().includes(feature.toLowerCase());
    }

    /**
     * Convert transaction to plain object
     * @returns {Object}
     */
    toObject() {
        return {
            id: this.id,
            userId: this.userId,
            amount: this.amount,
            balanceAfter: this.balanceAfter,
            reason: this.reason,
            metadata: this.metadata,
            createdAt: this.createdAt,
            type: this.getTransactionType(),
        };
    }
}
