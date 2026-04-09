import { UseCase, Result } from '../UseCase.js';

/**
 * Delete Collection Use Case
 */
export class DeleteCollectionUseCase extends UseCase {
    /**
     * @param {import('../../../interfaces/repositories/IDesignerRepository').IDesignerRepository} designerRepository
     */
    constructor(designerRepository) {
        super();
        this.designerRepository = designerRepository;
    }

    /**
     * Execute the use case
     * @param {Object} input - Collection deletion input
     * @returns {Promise<Result>} Result with deletion status
     */
    async execute(input) {
        try {
            const { collectionId, userId } = input;

            if (!collectionId) {
                return Result.fail('Collection ID is required');
            }

            if (!userId) {
                return Result.fail('User ID is required');
            }

            // Verify ownership
            const collection = await this.designerRepository.findCollectionById(collectionId);
            if (!collection) return Result.fail('Collection not found');
            if (collection.userId !== userId) return Result.fail('Unauthorized');

            await this.designerRepository.deleteCollection(collectionId);
            return Result.ok(true);
        } catch (error) {
            return Result.fail(error.message || 'Failed to delete collection');
        }
    }
}
