import { UseCase, Result } from '../UseCase.js';

/**
 * Generate AI Model Use Case
 * Invokes the generate-ai-model edge function via GenerationRepository
 */
export class GenerateAIModelUseCase extends UseCase {
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
     * @param {string} input.userId - User ID
     * @param {Object} input.params - Model generation parameters
     * @returns {Promise<Result>} Result with generation data
     */
    async execute(input) {
        try {
            const { userId, params } = input;

            if (!userId) {
                return Result.fail('User ID is required');
            }

            const result = await this.generationRepository.invokeGenerateAIModel(params);

            return Result.ok(result);
        } catch (error) {
            return Result.fail(error.message || 'Failed to generate AI model');
        }
    }
}
