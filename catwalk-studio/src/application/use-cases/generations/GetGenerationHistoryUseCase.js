import { UseCase, Result } from '../UseCase.js';
import { GenerationDTO } from '../../dto/GenerationDTO.js';

/**
 * Get Generation History Use Case
 * Retrieves user's generation history
 */
export class GetGenerationHistoryUseCase extends UseCase {
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
     * @param {number} [input.limit] - Maximum results
     * @param {string} [input.status] - Filter by status
     * @returns {Promise<Result>} Result with array of generation DTOs
     */
    async execute(input) {
        try {
            const { userId, limit = 50, status, type } = input;

            if (!userId) {
                return Result.fail('User ID is required');
            }

            // Get generations from repository
            const generations = await this.generationRepository.findByUserId(userId, { limit, status, type });

            // Convert to DTOs
            const generationDTOs = generations.map(gen => GenerationDTO.fromEntity(gen));

            return Result.ok(generationDTOs);
        } catch (error) {
            return Result.fail(error.message || 'Failed to get generation history');
        }
    }
}
