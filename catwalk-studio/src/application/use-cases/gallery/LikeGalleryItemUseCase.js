import { UseCase, Result } from '../UseCase.js';

/**
 * Like Gallery Item Use Case
 * Updates like count on a gallery item
 */
export class LikeGalleryItemUseCase extends UseCase {
    constructor(generationRepository) {
        super();
        this.generationRepository = generationRepository;
    }

    async execute(input) {
        try {
            const { galleryId, currentLikes, isLiked, userId } = input;

            if (!galleryId) {
                return Result.fail('Gallery ID is required');
            }

            const newLikeCount = isLiked
                ? Math.max(0, (currentLikes || 0) - 1)
                : (currentLikes || 0) + 1;

            await this.generationRepository.updateGalleryLikes(galleryId, newLikeCount);

            // Also track user-specific like if userId is provided
            if (userId) {
                await this.generationRepository.toggleUserGalleryLike(userId, galleryId, isLiked);
            }

            return Result.ok({ newLikeCount });
        } catch (error) {
            return Result.fail(error.message || 'Failed to like gallery item');
        }
    }
}
