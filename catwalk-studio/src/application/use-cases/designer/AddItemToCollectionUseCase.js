import { UseCase, Result } from '../UseCase.js';

/**
 * Add Item to Collection Use Case
 */
export class AddItemToCollectionUseCase extends UseCase {
    /**
     * @param {import('../../../interfaces/repositories/IDesignerRepository').IDesignerRepository} designerRepository
     */
    constructor(designerRepository) {
        super();
        this.designerRepository = designerRepository;
    }

    /**
     * Execute the use case
     * @param {Object} input - Input data
     * @param {string} input.collectionId - ID of the collection
     * @param {string} input.itemId - ID of the item to add
     * @returns {Promise<Result>} Result of the operation
     */
    async execute(input) {
        try {
            const { collectionId, itemId } = input;

            if (!collectionId || !itemId) {
                return Result.fail('Collection ID and Item ID are required');
            }

            // 1. Get current collection
            const collection = await this.designerRepository.findCollectionById(collectionId);
            if (!collection) {
                return Result.fail('Collection not found');
            }

            // 2. Add item ID to the array if not already present
            const itemIds = collection.itemIds || [];
            if (itemIds.includes(itemId)) {
                return Result.ok(); // Already in collection
            }

            collection.itemIds = [...itemIds, itemId];

            // 3. Save updated collection
            await this.designerRepository.saveCollection(collection);

            return Result.ok();
        } catch (error) {
            return Result.fail(error.message || 'Failed to add item to collection');
        }
    }
}
