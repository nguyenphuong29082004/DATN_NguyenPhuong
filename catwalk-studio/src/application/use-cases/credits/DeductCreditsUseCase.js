import { UseCase, Result } from '../UseCase.js';
import { CreditTransactionDTO } from '../../dto/CreditDTO.js';
import { CreditTransaction } from '../../../domain/entities/CreditTransaction.js';

/**
 * Deduct Credits Use Case
 * Orchestrates credit deduction with full transaction logging
 * 
 * Flow:
 * 1. Get user entity
 * 2. Check if user can afford
 * 3. Deduct credits from user
 * 4. Save updated user
 * 5. Create and log credit transaction
 */
export class DeductCreditsUseCase extends UseCase {
    /**
     * @param {import('../../../interfaces/repositories/IUserRepository').IUserRepository} userRepository
     * @param {import('../../../interfaces/repositories/ICreditRepository').ICreditRepository} creditRepository
     */
    constructor(userRepository, creditRepository) {
        super();
        this.userRepository = userRepository;
        this.creditRepository = creditRepository;
    }

    /**
     * Execute the use case
     * @param {Object} input - Deduction input
     * @param {string} input.userId - User ID
     * @param {number} input.amount - Amount to deduct
     * @param {string} input.reason - Reason for deduction
     * @param {Object} [input.metadata] - Additional metadata
     * @returns {Promise<Result>} Result with new balance
     */
    async execute(input) {
        try {
            const { userId, amount, reason, metadata = {} } = input;

            // Validate input
            if (!userId) {
                return Result.fail('User ID is required');
            }

            if (!amount || amount <= 0) {
                return Result.fail('Amount must be greater than 0');
            }

            if (!reason) {
                return Result.fail('Reason is required');
            }

            // Get user entity
            const user = await this.userRepository.findById(userId);

            if (!user) {
                return Result.fail('User not found');
            }

            // Block guest users from spending credits
            if (user.isGuest) {
                return Result.fail('Guest users cannot spend credits. Please create an account.');
            }

            // Check if user can afford (domain logic)
            if (!user.canAfford(amount)) {
                return Result.fail(`Insufficient credits. Required: ${amount}, Available: ${user.creditBalance}`);
            }

            // Deduct credits (domain logic)
            user.deductCredits(amount);

            // Save updated user
            await this.userRepository.save(user);

            // Create transaction entity
            const transaction = CreditTransaction.create({
                userId: user.id,
                amount: -amount, // Negative for deduction
                balanceAfter: user.creditBalance,
                reason,
                metadata,
            });

            // Log transaction
            await this.creditRepository.logTransaction(transaction);

            // Return result with transaction DTO
            const transactionDTO = CreditTransactionDTO.fromEntity(transaction);

            return Result.ok({
                success: true,
                newBalance: user.creditBalance,
                transaction: transactionDTO,
            });
        } catch (error) {
            return Result.fail(error.message || 'Failed to deduct credits');
        }
    }
}
