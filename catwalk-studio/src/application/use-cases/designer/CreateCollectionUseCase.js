import { UseCase, Result } from '../UseCase.js';
import { Collection } from '../../../domain/entities/Collection.js';
import { CollectionDTO } from '../../dto/DesignerDTO.js';

/**
 * Create Collection Use Case
 */
export class CreateCollectionUseCase extends UseCase {
    /**
     * @param {import('../../../interfaces/repositories/IDesignerRepository').IDesignerRepository} designerRepository
     */
    constructor(designerRepository) {
        super();
        this.designerRepository = designerRepository;
    }

    /**
     * Execute the use case
     * @param {Object} input - Collection creation input
     * @returns {Promise<Result>} Result with created collection DTO
     */
    async execute(input) {
        try {
            const { userId, name, description, isPublic, itemIds, tags } = input;

            if (!userId) {
                return Result.fail('User ID is required');
            }

            if (!name || name.trim() === '') {
                return Result.fail('Collection name is required');
            }

            // Create collection entity
            const collection = Collection.create({
                userId,
                name: name.trim(),
                description: description || '',
                isPublic: isPublic || false,
                itemIds: itemIds || [],
                tags: tags || [],
            });

            // Save collection
            const savedCollection = await this.designerRepository.createCollection(collection);

            // Convert to DTO
            const collectionDTO = CollectionDTO.fromEntity(savedCollection);

            return Result.ok(collectionDTO);
        } catch (error) {
            return Result.fail(error.message || 'Failed to create collection');
        }
    }
}
