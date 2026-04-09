import { UseCase, Result } from '../UseCase.js';

/**
 * Get User Gallery Likes Use Case
 * Retrieves IDs of gallery items liked by a specific user
 */
export class GetUserGalleryLikesUseCase extends UseCase {
    constructor(generationRepository) {
        super();
        this.generationRepository = generationRepository;
    }

    async execute(input) {
        try {
            const { userId } = input;

            if (!userId) {
                return Result.fail('User ID is required');
            }

            const likedIds = await this.generationRepository.getUserGalleryLikes(userId);

            return Result.ok(likedIds);
        } catch (error) {
            return Result.fail(error.message || 'Failed to get user gallery likes');
        }
    }
}
