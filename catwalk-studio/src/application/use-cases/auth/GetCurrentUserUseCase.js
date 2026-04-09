import { UseCase, Result } from '../UseCase.js';
import { UserProfileDTO } from '../../dto/UserDTO.js';

/**
 * Get Current User Use Case
 * Retrieves the currently authenticated user's profile
 */
export class GetCurrentUserUseCase extends UseCase {
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
     * @returns {Promise<Result>} Result containing UserProfileDTO or null
     */
    async execute(userId) {
        try {
            if (!userId) {
                return Result.fail('User ID is required');
            }

            const user = await this.userRepository.findById(userId);

            if (!user) {
                return Result.ok(null); // User not found
            }

            // Convert entity to DTO
            const userDTO = UserProfileDTO.fromEntity(user);

            return Result.ok(userDTO);
        } catch (error) {
            return Result.fail(error.message || 'Failed to get user profile');
        }
    }
}
