import { UseCase, Result } from '../UseCase.js';
import { Model } from '../../../domain/entities/Model.js';

/**
 * Create Model Use Case
 * Creates a new fashion model (AI-generated) and saves to `models` table
 */
export class CreateModelUseCase extends UseCase {
    /**
     * @param {import('../../../interfaces/repositories/IModelRepository').IModelRepository} modelRepository
     */
    constructor(modelRepository) {
        super();
        this.modelRepository = modelRepository;
    }

    /**
     * @param {Object} input
     * @param {string} input.displayName - Model name
     * @param {string} [input.username]
     * @param {string} [input.description]
     * @param {string} [input.profileImageUrl]
     * @param {boolean} [input.isAi] - Whether AI-generated
     * @param {string[]} [input.styleTags]
     * @param {string[]} [input.modelTypes]
     * @param {Object} [input.trainingData] - AI generation parameters
     * @returns {Promise<Result>}
     */
    async execute(input) {
        try {
            const { displayName, username, description, profileImageUrl, isAi, styleTags, modelTypes, trainingData } = input;

            if (!displayName || displayName.trim() === '') {
                return Result.fail('Display name is required');
            }

            const model = Model.create({
                displayName: displayName.trim(),
                username: username || null,
                description: description || null,
                profileImageUrl: profileImageUrl || null,
                isAi: isAi ?? true,
                status: isAi ? 'active' : 'in_review',
                styleTags: styleTags || [],
                modelTypes: modelTypes || [],
                trainingData: trainingData ? [trainingData] : [],
            });

            const savedModel = await this.modelRepository.create(model);
            return Result.ok(savedModel.toObject());
        } catch (error) {
            return Result.fail(error.message || 'Failed to create model');
        }
    }
}
