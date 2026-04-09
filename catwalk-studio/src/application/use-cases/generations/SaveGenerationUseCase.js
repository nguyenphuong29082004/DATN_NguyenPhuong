import { UseCase, Result } from '../UseCase.js';

/**
 * Save Generation Use Case
 * Marks a generation as permanently saved by the user.
 * Per requirement 4.1: Generate creates a temporary preview,
 * user must explicitly Save to persist.
 */
export class SaveGenerationUseCase extends UseCase {
    /**
     * @param {import('../../../interfaces/repositories/IGenerationRepository').IGenerationRepository} generationRepository
     */
    constructor(generationRepository) {
        super();
        this.generationRepository = generationRepository;
    }

    /**
     * @param {Object} input
     * @param {string} input.generationId - Generation ID to save
     * @returns {Promise<Result>}
     */
    async execute(input) {
        try {
            const { generationId } = input;

            if (!generationId) {
                return Result.fail('Generation ID is required');
            }

            await this.generationRepository.saveGeneration(generationId);

            return Result.ok({ saved: true });
        } catch (error) {
            return Result.fail(error.message || 'Failed to save generation');
        }
    }
}
