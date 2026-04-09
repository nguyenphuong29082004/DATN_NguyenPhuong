import { UseCase, Result } from '../UseCase.js';
import { AIModelDTO } from '../../dto/AIModelDTO.js';

/**
 * Get User Models Use Case
 * Retrieves all models owned by a specific user
 */
export class GetUserModelsUseCase extends UseCase {
    /**
     * @param {import('../../../interfaces/repositories/IAIModelRepository').IAIModelRepository} aiModelRepository
     */
    constructor(aiModelRepository) {
        super();
        this.aiModelRepository = aiModelRepository;
    }

    /**
     * Execute the use case
     * @param {string} userId - User ID
     * @returns {Promise<Result>} Result with array of model DTOs
     */
    async execute(userId) {
        try {
            if (!userId) {
                return Result.fail('User ID is required');
            }

            // Get models from repository
            const models = await this.aiModelRepository.findByUserId(userId);

            // Convert to DTOs
            const modelDTOs = models.map(model => AIModelDTO.fromEntity(model));

            return Result.ok(modelDTOs);
        } catch (error) {
            return Result.fail(error.message || 'Failed to get user models');
        }
    }
}
