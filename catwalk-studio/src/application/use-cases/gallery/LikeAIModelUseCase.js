import { UseCase, Result } from '../UseCase.js';

/**
 * Like AI Model Use Case
 * Increments likes on a public AI model
 */
export class LikeAIModelUseCase extends UseCase {
    /**
     * @param {import('../../../interfaces/repositories/IAIModelRepository').IAIModelRepository} aiModelRepository
     */
    constructor(aiModelRepository) {
        super();
        this.aiModelRepository = aiModelRepository;
    }

    /**
     * Execute the use case
     * @param {Object} input - Input parameters
     * @param {string} input.modelId - Model ID
     * @param {string} input.userId - User ID (for tracking who liked)
     * @returns {Promise<Result>} Result indicating success
     */
    async execute(input) {
        try {
            const { modelId, userId: _userId } = input;

            if (!modelId) {
                return Result.fail('Model ID is required');
            }

            // Get model entity
            const model = await this.aiModelRepository.findById(modelId);

            if (!model) {
                return Result.fail('Model not found');
            }

            // Increment likes using domain logic (validates isPublic)
            model.incrementLikes();

            // Save updated model
            await this.aiModelRepository.save(model);

            return Result.ok({
                success: true,
                likes: model.likes
            });
        } catch (error) {
            return Result.fail(error.message || 'Failed to like model');
        }
    }
}
