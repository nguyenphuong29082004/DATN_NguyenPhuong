import { UseCase, Result } from '../UseCase.js';

/**
 * Get Gallery Item Use Case
 * Retrieves a single gallery item by ID
 */
export class GetGalleryItemUseCase extends UseCase {
    constructor(generationRepository) {
        super();
        this.generationRepository = generationRepository;
    }

    async execute(input) {
        try {
            const { galleryId } = input;

            if (!galleryId) {
                return Result.fail('Gallery ID is required');
            }

            const item = await this.generationRepository.findGalleryItemById(galleryId);

            if (!item) {
                return Result.fail('Gallery item not found');
            }

            return Result.ok(item);
        } catch (error) {
            return Result.fail(error.message || 'Failed to get gallery item');
        }
    }
}
