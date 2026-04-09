import { UseCase, Result } from '../UseCase.js';
import { WardrobeItemDTO } from '../../dto/WardrobeItemDTO.js';

/**
 * Get Public Wardrobe Items Use Case
 * Retrieves all public and platform default wardrobe items
 */
export class GetPublicWardrobeItemsUseCase extends UseCase {
    /**
     * @param {import('../../../interfaces/repositories/IWardrobeRepository').IWardrobeRepository} wardrobeRepository
     */
    constructor(wardrobeRepository) {
        super();
        this.wardrobeRepository = wardrobeRepository;
    }

    /**
     * Execute the use case
     * Supports both legacy signature `execute()` and
     * paginated signature `execute({ category, limit, offset })`.
     *
     * @param {Object} [input] - Optional paginated input object
     * @returns {Promise<Result>} Result with wardrobe item DTO array or paginated payload
     */
    async execute(input = null) {
        try {
            const categories = input?.categories || (input?.category ? [input.category] : []);
            const limit = input?.limit;
            const offset = input?.offset ?? 0;
            const queryLimit = typeof limit === 'number' && limit > 0 ? limit + 1 : undefined;

            const wardrobeItems = await this.wardrobeRepository.findPublicAndDefault({
                categories,
                limit: queryLimit,
                offset,
            });
            const wardrobeItemDTOs = wardrobeItems.map(item => WardrobeItemDTO.fromEntity(item));

            if (!queryLimit) {
                return Result.ok(wardrobeItemDTOs);
            }

            const hasMore = wardrobeItemDTOs.length > limit;
            const items = hasMore ? wardrobeItemDTOs.slice(0, limit) : wardrobeItemDTOs;

            return Result.ok({
                items,
                hasMore,
                nextOffset: offset + items.length,
            });
        } catch (error) {
            return Result.fail(error.message || 'Failed to get public wardrobe items');
        }
    }
}
