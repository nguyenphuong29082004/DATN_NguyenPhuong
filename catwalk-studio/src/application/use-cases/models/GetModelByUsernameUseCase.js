import { UseCase, Result } from '../UseCase.js';

/**
 * Get Model By Username Use Case
 * Fetches a single model by username — for ModelProfile page
 */
export class GetModelByUsernameUseCase extends UseCase {
    constructor(modelRepository) {
        super();
        this.modelRepository = modelRepository;
    }

    /**
     * @param {string} username
     * @returns {Promise<Result>}
     */
    async execute(username) {
        try {
            if (!username) {
                return Result.fail('Username is required');
            }

            const model = await this.modelRepository.findPublicByUsername(username);

            if (!model) {
                return Result.fail('Model not found');
            }

            return Result.ok(model.toObject());
        } catch (error) {
            return Result.fail(error.message || 'Failed to get model');
        }
    }
}
