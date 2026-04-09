import { UseCase, Result } from '../UseCase.js';
import { GenerationDTO } from '../../dto/GenerationDTO.js';

/**
 * Get Generation Status Use Case
 * Polls a generation by ID and returns its current status
 */
export class GetGenerationStatusUseCase extends UseCase {
    constructor(generationRepository) {
        super();
        this.generationRepository = generationRepository;
    }

    async execute(input) {
        try {
            const { generationId } = input;
            if (!generationId) return Result.fail('Generation ID is required');

            const generation = await this.generationRepository.findById(generationId);
            if (!generation) return Result.fail('Generation not found');

            return Result.ok(GenerationDTO.fromEntity(generation));
        } catch (error) {
            return Result.fail(error.message || 'Failed to get generation status');
        }
    }
}
