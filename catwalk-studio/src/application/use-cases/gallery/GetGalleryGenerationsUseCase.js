import { UseCase, Result } from '../UseCase.js';
import { GenerationDTO } from '../../dto/GenerationDTO.js';

/**
 * Get Gallery Generations Use Case
 * Retrieves public published generations for the gallery
 * This reuses the Generation domain with isPublished filtering
 */
export class GetGalleryGenerationsUseCase extends UseCase {
    /**
     * @param {import('../../../interfaces/repositories/IGenerationRepository').IGenerationRepository} generationRepository
     */
    constructor(generationRepository) {
        super();
        this.generationRepository = generationRepository;
    }

    /**
     * Execute the use case
     * @param {Object} [input] - Input parameters
     * @param {number} [input.limit] - Maximum results
     * @returns {Promise<Result>} Result with array of generation DTOs
     */
    async execute(input = {}) {
        try {
            const { limit = 50 } = input;

            // Get public generations from repository
            const generations = await this.generationRepository.findPublic({ limit });

            // Convert to DTOs
            const generationDTOs = generations.map(gen => GenerationDTO.fromEntity(gen));

            return Result.ok(generationDTOs);
        } catch (error) {
            return Result.fail(error.message || 'Failed to get gallery generations');
        }
    }
}
