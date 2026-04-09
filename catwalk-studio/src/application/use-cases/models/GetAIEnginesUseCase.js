import { UseCase, Result } from '../UseCase.js';

/**
 * Get AI Engines Use Case
 * Gets active AI engine models from aimodel_mapper
 */
export class GetAIEnginesUseCase extends UseCase {
    constructor(modelRepository) {
        super();
        this.modelRepository = modelRepository;
    }

    async execute() {
        try {
            const engines = await this.modelRepository.findActiveAIEngines();
            return Result.ok(engines);
        } catch (error) {
            return Result.fail(error.message || 'Failed to get AI engines');
        }
    }
}
