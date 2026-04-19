/**
 * Credit Data Transfer Objects (DTOs)
 */

/**
 * Credit Transaction DTO
 * Used for returning transaction data to the UI
 */
export class CreditTransactionDTO {
    constructor(data) {
        this.id = data.id;
        this.userId = data.userId;
        this.amount = data.amount;
        this.balanceAfter = data.balanceAfter;
        this.reason = data.reason;
        this.metadata = data.metadata;
        this.createdAt = data.createdAt;
        this.amountPaid = data.amountPaid ?? null;
        this.currency = data.currency ?? null;
        this.paymentMethod = data.paymentMethod ?? null;
        this.type = data.type; // 'credit' or 'debit'
    }

    static fromEntity(transaction) {
        return new CreditTransactionDTO({
            id: transaction.id,
            userId: transaction.userId,
            amount: transaction.amount,
            balanceAfter: transaction.balanceAfter,
            reason: transaction.reason,
            metadata: transaction.metadata,
            createdAt: transaction.createdAt,
            amountPaid: transaction.amountPaid,
            currency: transaction.currency,
            paymentMethod: transaction.paymentMethod,
            type: transaction.getTransactionType(),
        });
    }
}

/**
 * Credit Balance DTO
 */
export class CreditBalanceDTO {
    constructor(data) {
        this.userId = data.userId;
        this.balance = data.balance;
        this.subscriptionTier = data.subscriptionTier;
    }
}

/**
 * Deduct Credits Input DTO
 */
export class DeductCreditsDTO {
    constructor(data) {
        this.userId = data.userId;
        this.amount = data.amount;
        this.reason = data.reason;
        this.metadata = data.metadata || {};
    }
}

/**
 * Add Credits Input DTO
 */
export class AddCreditsDTO {
    constructor(data) {
        this.userId = data.userId;
        this.amount = data.amount;
        this.reason = data.reason;
        this.metadata = data.metadata || {};
    }
}
