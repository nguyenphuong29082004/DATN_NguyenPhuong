import { UseCase, Result } from '../UseCase.js';

/**
 * Add To Gallery Use Case
 * Adds a generation to the gallery (checks for duplicates)
 */
export class AddToGalleryUseCase extends UseCase {
    constructor(generationRepository) {
        super();
        this.generationRepository = generationRepository;
    }

    async execute(input) {
        try {
            const result = await this.generationRepository.addToGallery(input);
            return Result.ok(result);
        } catch (error) {
            return Result.fail(error.message || 'Failed to add to gallery');
        }
    }
}
