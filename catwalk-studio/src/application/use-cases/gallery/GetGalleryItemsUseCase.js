import { UseCase, Result } from '../UseCase.js';

/**
 * Get Gallery Items Use Case
 * Retrieves paginated gallery items with filters
 */
export class GetGalleryItemsUseCase extends UseCase {
    constructor(generationRepository) {
        super();
        this.generationRepository = generationRepository;
    }

    async execute(input = {}) {
        try {
            const { page = 0, limit = 20, type, style } = input;

            const result = await this.generationRepository.findGalleryItems({ page, limit, type, style });

            return Result.ok(result);
        } catch (error) {
            return Result.fail(error.message || 'Failed to get gallery items');
        }
    }
}
