import { UseCase, Result } from '../UseCase.js';
import { DesignerItemDTO } from '../../dto/DesignerDTO.js';

/**
 * Get Wardrobe Items Use Case
 * Retrieves all designer items for a user (wardrobe)
 */
export class GetWardrobeItemsUseCase extends UseCase {
    /**
     * @param {import('../../../interfaces/repositories/IDesignerRepository').IDesignerRepository} designerRepository
     */
    constructor(designerRepository) {
        super();
        this.designerRepository = designerRepository;
    }

    /**
     * Execute the use case
     * @param {Object} input - Input parameters
     * @param {string} input.userId - User ID
     * @param {string} [input.category] - Optional category filter
     * @returns {Promise<Result>} Result with array of item DTOs
     */
    async execute(input) {
        try {
            const { userId, category } = input;

            if (!userId) {
                return Result.fail('User ID is required');
            }

            // Get items from repository
            const items = await this.designerRepository.findItemsByUserId(userId, { category });

            // Convert to DTOs
            const itemDTOs = items.map(item => DesignerItemDTO.fromEntity(item));

            return Result.ok(itemDTOs);
        } catch (error) {
            return Result.fail(error.message || 'Failed to get wardrobe items');
        }
    }
}
