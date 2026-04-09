import { UseCase, Result } from '../UseCase.js';

/**
 * Update User Profile Use Case
 * Updates user profile information
 */
export class UpdateUserProfileUseCase extends UseCase {
    /**
     * @param {import('../../../interfaces/repositories/IUserRepository').IUserRepository} userRepository
     */
    constructor(userRepository) {
        super();
        this.userRepository = userRepository;
    }

    /**
     * Execute the use case
     * @param {Object} input - Update input
     * @param {string} input.userId - User ID
     * @param {string} [input.displayName] - New display name
     * @param {string} [input.avatarUrl] - New avatar URL
     * @returns {Promise<Result>} Result indicating success
     */
    async execute(input) {
        try {
            const { userId, displayName, avatarUrl } = input;

            if (!userId) {
                return Result.fail('User ID is required');
            }

            // Get user entity
            const user = await this.userRepository.findById(userId);

            if (!user) {
                return Result.fail('User not found');
            }

            // Update profile using domain logic
            const updates = {};
            if (displayName !== undefined) updates.displayName = displayName;
            if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

            user.updateProfile(updates);

            // Save updated user
            await this.userRepository.save(user);

            return Result.ok({ success: true });
        } catch (error) {
            return Result.fail(error.message || 'Failed to update user profile');
        }
    }
}
