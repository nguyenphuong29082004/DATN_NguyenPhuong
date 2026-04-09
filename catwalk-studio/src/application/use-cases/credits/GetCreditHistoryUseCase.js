import { UseCase, Result } from '../UseCase.js';
import { CreditTransactionDTO } from '../../dto/CreditDTO.js';

/**
 * Get Credit History Use Case
 * Retrieve user's credit transaction history
 */
export class GetCreditHistoryUseCase extends UseCase {
    /**
     * @param {import('../../../interfaces/repositories/ICreditRepository').ICreditRepository} creditRepository
     */
    constructor(creditRepository) {
        super();
        this.creditRepository = creditRepository;
    }

    /**
     * Execute the use case
     * @param {Object} input - Input parameters
     * @param {string} input.userId - User ID
     * @param {number} [input.limit=50] - Maximum number of transactions to return
     * @returns {Promise<Result>} Result with transaction history
     */
    async execute(input) {
        try {
            const { userId, limit = 50 } = input;

            if (!userId) {
                return Result.fail('User ID is required');
            }

            // Get transactions from repository
            const transactions = await this.creditRepository.getHistory(userId, limit);

            // Convert to DTOs
            const transactionDTOs = transactions.map(tx => CreditTransactionDTO.fromEntity(tx));

            return Result.ok(transactionDTOs);
        } catch (error) {
            return Result.fail(error.message || 'Failed to get credit history');
        }
    }
}
