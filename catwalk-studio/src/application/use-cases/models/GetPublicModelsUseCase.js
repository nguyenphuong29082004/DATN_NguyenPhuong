import { UseCase, Result } from '../UseCase.js';

/**
 * Get Public Models Use Case
 * Retrieves all active models, sorted Elite first (SRS requirement)
 * Uses ModelRepository → models table
 */
export class GetPublicModelsUseCase extends UseCase {
    /**
     * @param {import('../../../interfaces/repositories/IModelRepository').IModelRepository} modelRepository
     */
    constructor(modelRepository) {
        super();
        this.modelRepository = modelRepository;
    }

    /**
     * @param {Object} [filters]
     * @param {string} [filters.modelType] - 'ai' | 'real'
     * @param {string[]} [filters.styleTags] - Filter by style tags
     * @param {boolean} [filters.eliteOnly] - Show only elite models
     * @param {number} [filters.limit] - Maximum number of models
     * @returns {Promise<Result>} Result with array of model objects
     */
    async execute(filters = {}) {
        try {
            const models = await this.modelRepository.findPublic(filters);
            const modelDTOs = models.map(model => model.toObject());
            return Result.ok(modelDTOs);
        } catch (error) {
            return Result.fail(error.message || 'Failed to get public models');
        }
    }
}
