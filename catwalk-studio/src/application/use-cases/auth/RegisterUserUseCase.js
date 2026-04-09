import { UseCase, Result } from '../UseCase.js';
import { UserProfileDTO } from '../../dto/UserDTO.js';

/**
 * Register User Use Case
 * Creates a new user account (anonymous or with email/password)
 */
export class RegisterUserUseCase extends UseCase {
    /**
     * @param {import('../../../interfaces/repositories/IUserRepository').IUserRepository} userRepository
     */
    constructor(userRepository) {
        super();
        this.userRepository = userRepository;
    }

    /**
     * Execute the use case
     * @param {Object} input - Registration input
     * @param {string} [input.email] - User email (optional for anonymous)
     * @param {boolean} [input.isAnonymous] - Whether this is anonymous registration
     * @returns {Promise<Result>} Result containing UserProfileDTO
     */
    async execute(input) {
        try {
            const { email = null, isAnonymous: _isAnonymous = true } = input;

            // Create user entity
            const userData = {
                email: email || `anon-${Date.now()}@catwalk.ai`,
                displayName: email ? email.split('@')[0] : 'Guest User',
                creditBalance: 100, // Welcome bonus
                subscriptionTier: 'free',
                isModel: false,
                isElite: false
            };

            // Create user through repository
            const user = await this.userRepository.create(userData);

            // Convert to DTO
            const userDTO = UserProfileDTO.fromEntity(user);

            return Result.ok(userDTO);
        } catch (error) {
            return Result.fail(error.message || 'Failed to register user');
        }
    }
}
