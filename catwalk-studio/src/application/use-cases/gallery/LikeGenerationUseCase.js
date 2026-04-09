import { UseCase, Result } from '../UseCase.js';

/**
 * Like Generation Use Case
 * Increments likes on a published generation
 */
export class LikeGenerationUseCase extends UseCase {
    /**
     * @param {import('../../../interfaces/repositories/IGenerationRepository').IGenerationRepository} generationRepository
     */
    constructor(generationRepository) {
        super();
        this.generationRepository = generationRepository;
    }

    /**
     * Execute the use case
     * @param {Object} input - Input parameters
     * @param {string} input.generationId - Generation ID
     * @param {string} input.userId - User ID (for tracking who liked)
     * @returns {Promise<Result>} Result indicating success
     */
    async execute(input) {
        try {
            const { generationId, userId: _userId } = input;

            if (!generationId) {
                return Result.fail('Generation ID is required');
            }

            // Get generation entity
            const generation = await this.generationRepository.findById(generationId);

            if (!generation) {
                return Result.fail('Generation not found');
            }

            // Increment likes using domain logic (validates isPublished)
            generation.incrementLikes();

            // Save updated generation
            await this.generationRepository.save(generation);

            return Result.ok({
                success: true,
                likes: generation.likes
            });
        } catch (error) {
            return Result.fail(error.message || 'Failed to like generation');
        }
    }
}
