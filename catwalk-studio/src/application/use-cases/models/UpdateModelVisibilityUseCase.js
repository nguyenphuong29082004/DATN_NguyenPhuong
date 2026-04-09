import { UseCase, Result } from '../UseCase.js';

/**
 * Update Model Visibility Use Case
 * Updates whether a model is public or private
 */
export class UpdateModelVisibilityUseCase extends UseCase {
    /**
     * @param {import('../../../interfaces/repositories/IAIModelRepository').IAIModelRepository} aiModelRepository
     */
    constructor(aiModelRepository) {
        super();
        this.aiModelRepository = aiModelRepository;
    }

    /**
     * Execute the use case
     * @param {Object} input - Update input
     * @param {string} input.modelId - Model ID
     * @param {string} input.userId - User ID (for ownership check)
     * @param {boolean} input.isPublic - New visibility state
     * @returns {Promise<Result>} Result indicating success
     */
    async execute(input) {
        try {
            const { modelId, userId, isPublic } = input;

            // Validate input
            if (!modelId) {
                return Result.fail('Model ID is required');
            }

            if (!userId) {
                return Result.fail('User ID is required');
            }

            if (typeof isPublic !== 'boolean') {
                return Result.fail('isPublic must be a boolean');
            }

            // Get model entity
            const model = await this.aiModelRepository.findById(modelId);

            if (!model) {
                return Result.fail('Model not found');
            }

            // Check ownership using domain logic
            if (!model.isOwnedBy(userId)) {
                return Result.fail('You do not have permission to update this model');
            }

            // Update visibility using domain logic
            model.updateVisibility(isPublic);

            // Save updated model
            await this.aiModelRepository.save(model);

            return Result.ok({ success: true, isPublic: model.isPublic });
        } catch (error) {
            return Result.fail(error.message || 'Failed to update model visibility');
        }
    }
}
