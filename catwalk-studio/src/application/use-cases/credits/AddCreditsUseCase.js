import { UseCase, Result } from '../UseCase.js';
import { CreditTransactionDTO } from '../../dto/CreditDTO.js';
import { CreditTransaction } from '../../../domain/entities/CreditTransaction.js';

/**
 * Add Credits Use Case
 * Add credits to user account with transaction logging
 */
export class AddCreditsUseCase extends UseCase {
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
     * @param {Object} input - Addition input
     * @param {string} input.userId - User ID
     * @param {number} input.amount - Amount to add
     * @param {string} input.reason - Reason for addition
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

            // Add credits (domain logic)
            user.addCredits(amount);

            // Save updated user
            await this.userRepository.save(user);

            // Create transaction entity
            const transaction = CreditTransaction.create({
                userId: user.id,
                amount: amount, // Positive for addition
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
            return Result.fail(error.message || 'Failed to add credits');
        }
    }
}
