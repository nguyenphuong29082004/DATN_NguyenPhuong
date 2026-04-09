import { UseCase, Result } from '../UseCase.js';
import { CreditBalanceDTO } from '../../dto/CreditDTO.js';

/**
 * Get Credit Balance Use Case
 * Get current credit balance for a user
 */
export class GetCreditBalanceUseCase extends UseCase {
    /**
     * @param {import('../../../interfaces/repositories/IUserRepository').IUserRepository} userRepository
     */
    constructor(userRepository) {
        super();
        this.userRepository = userRepository;
    }

    /**
     * Execute the use case
     * @param {string} userId - User ID
     * @returns {Promise<Result>} Result with credit balance
     */
    async execute(userId) {
        try {
            if (!userId) {
                return Result.fail('User ID is required');
            }

            // Get user entity
            const user = await this.userRepository.findById(userId);

            if (!user) {
                return Result.fail('User not found');
            }

            // Create balance DTO
            const balanceDTO = new CreditBalanceDTO({
                userId: user.id,
                balance: user.creditBalance,
                subscriptionTier: user.subscriptionTier,
            });

            return Result.ok(balanceDTO);
        } catch (error) {
            return Result.fail(error.message || 'Failed to get credit balance');
        }
    }
}
