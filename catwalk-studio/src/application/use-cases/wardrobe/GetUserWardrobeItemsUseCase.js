import { UseCase, Result } from '../UseCase.js';
import { WardrobeItemDTO } from '../../dto/WardrobeItemDTO.js';

/**
 * Get User Wardrobe Items Use Case
 * Retrieves all wardrobe items owned by a specific user
 */
export class GetUserWardrobeItemsUseCase extends UseCase {
    /**
     * @param {import('../../../interfaces/repositories/IWardrobeRepository').IWardrobeRepository} wardrobeRepository
     */
    constructor(wardrobeRepository) {
        super();
        this.wardrobeRepository = wardrobeRepository;
    }

    /**
     * Execute the use case
     * Supports both legacy signature `execute(userId)` and
     * paginated signature `execute({ userId, category, limit, offset })`.
     *
     * @param {string|Object} input - User ID or paginated input object
     * @returns {Promise<Result>} Result with wardrobe item DTO array or paginated payload
     */
    async execute(input) {
        try {
            const isLegacySignature = typeof input === 'string';
            const userId = isLegacySignature ? input : input?.userId;
            const categories = isLegacySignature ? [] : (input?.categories || (input?.category ? [input.category] : []));
            const limit = isLegacySignature ? null : input?.limit;
            const offset = isLegacySignature ? 0 : (input?.offset ?? 0);

            if (!userId) {
                return Result.fail('User ID is required');
            }

            // Get wardrobe items from repository
            const queryLimit = typeof limit === 'number' && limit > 0 ? limit + 1 : undefined;
            const wardrobeItems = await this.wardrobeRepository.findByUserId(userId, {
                categories,
                limit: queryLimit,
                offset,
            });

            // Convert to DTOs
            const wardrobeItemDTOs = wardrobeItems.map(item => WardrobeItemDTO.fromEntity(item));

            if (isLegacySignature || !queryLimit) {
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
            return Result.fail(error.message || 'Failed to get user wardrobe items');
        }
    }
}
