import { UseCase, Result } from '../UseCase.js';

/**
 * Get Shootable Models Use Case
 * Gets active models available for Quick Shoot
 */
export class GetShootableModelsUseCase extends UseCase {
    constructor(modelRepository) {
        super();
        this.modelRepository = modelRepository;
    }

    async execute() {
        try {
            const models = await this.modelRepository.findShootable();
            return Result.ok(models);
        } catch (error) {
            return Result.fail(error.message || 'Failed to get shootable models');
        }
    }
}
