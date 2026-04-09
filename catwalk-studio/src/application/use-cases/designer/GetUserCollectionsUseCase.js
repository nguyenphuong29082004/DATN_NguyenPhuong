import { UseCase, Result } from '../UseCase.js';
import { CollectionDTO } from '../../dto/DesignerDTO.js';

/**
 * Get User Collections Use Case
 */
export class GetUserCollectionsUseCase extends UseCase {
    /**
     * @param {import('../../../interfaces/repositories/IDesignerRepository').IDesignerRepository} designerRepository
     */
    constructor(designerRepository) {
        super();
        this.designerRepository = designerRepository;
    }

    /**
     * Execute the use case
     * @param {string} userId - User ID
     * @returns {Promise<Result>} Result with array of collection DTOs
     */
    async execute(userId) {
        try {
            if (!userId) {
                return Result.fail('User ID is required');
            }

            // Get collections from repository
            const collections = await this.designerRepository.findCollectionsByUserId(userId);

            // Convert to DTOs
            const collectionDTOs = collections.map(collection => CollectionDTO.fromEntity(collection));

            return Result.ok(collectionDTOs);
        } catch (error) {
            return Result.fail(error.message || 'Failed to get user collections');
        }
    }
}
