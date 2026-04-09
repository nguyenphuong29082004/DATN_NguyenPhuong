import { UseCase, Result } from '../UseCase.js';

/**
 * Publish to Gallery Use Case
 * Publishes a generation to the public gallery
 */
export class PublishToGalleryUseCase extends UseCase {
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
     * @param {string} input.userId - User ID (for ownership check)
     * @returns {Promise<Result>} Result indicating success
     */
    async execute(input) {
        try {
            const { generationId, userId } = input;

            // Validate input
            if (!generationId) {
                return Result.fail('Generation ID is required');
            }

            if (!userId) {
                return Result.fail('User ID is required');
            }

            // Get generation entity
            const generation = await this.generationRepository.findById(generationId);

            if (!generation) {
                return Result.fail('Generation not found');
            }

            // Check ownership using domain logic
            if (!generation.isOwnedBy(userId)) {
                return Result.fail('You do not have permission to publish this generation');
            }

            // Publish using domain logic (validates completion)
            generation.publish();

            // Save updated generation
            await this.generationRepository.save(generation);

            return Result.ok({ success: true, isPublished: generation.isPublished });
        } catch (error) {
            return Result.fail(error.message || 'Failed to publish to gallery');
        }
    }
}
