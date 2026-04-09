import { UseCase, Result } from '../UseCase.js';
import { WardrobeItem } from '../../../domain/entities/WardrobeItem.js';
import { WardrobeItemDTO } from '../../dto/WardrobeItemDTO.js';

/**
 * Create Wardrobe Item Use Case
 * Creates a new wardrobe item for a user
 */
export class CreateWardrobeItemUseCase extends UseCase {
    /**
     * @param {import('../../../interfaces/repositories/IWardrobeRepository').IWardrobeRepository} wardrobeRepository
     */
    constructor(wardrobeRepository) {
        super();
        this.wardrobeRepository = wardrobeRepository;
    }

    /**
     * Execute the use case
     * @param {Object} input - Wardrobe item creation input
     * @param {string} input.userId - Owner user ID
     * @param {string} input.title - Item title
     * @param {string} input.category - Item category
     * @param {string} [input.brand] - Item brand
     * @param {string} [input.style] - Item style
     * @param {string} [input.colour] - Item colour
     * @param {string[]} [input.keywords] - Search keywords
     * @param {string} [input.thumbnailUrl] - Thumbnail URL
     * @param {string} [input.highResImageUrl] - High-res image URL
     * @param {string} [input.buyUrl] - Purchase URL
     * @param {string} [input.description] - Item description
     * @param {string} [input.gender] - Target gender
     * @param {string} [input.colourHex] - Hex colour code
     * @param {boolean} [input.canBuy] - Whether item can be purchased
     * @returns {Promise<Result>} Result with created wardrobe item DTO
     */
    async execute(input) {
        try {
            const {
                userId, title, category, brand, style, colour,
                keywords, thumbnailUrl, highResImageUrl, buyUrl,
                description, gender, colourHex, canBuy,
            } = input;

            // Validate input
            if (!userId) {
                return Result.fail('User ID is required');
            }

            if (!title || title.trim() === '') {
                return Result.fail('Item title is required');
            }

            if (!category || category.trim() === '') {
                return Result.fail('Category is required');
            }

            // Create wardrobe item entity
            const wardrobeItemData = {
                userId,
                title: title.trim(),
                category: category.trim(),
                brand: brand || null,
                style: style || null,
                colour: colour || null,
                keywords: keywords || [],
                thumbnailUrl: thumbnailUrl || null,
                highResImageUrl: highResImageUrl || null,
                buyUrl: buyUrl || null,
                isStock: false,
                isUserUploaded: true,
                description: description || null,
                gender: gender || null,
                colourHex: colourHex || null,
                canBuy: canBuy || false,
            };

            const wardrobeItem = WardrobeItem.create(wardrobeItemData);

            // Save wardrobe item via repository
            const savedWardrobeItem = await this.wardrobeRepository.create(wardrobeItem);

            // Convert to DTO
            const wardrobeItemDTO = WardrobeItemDTO.fromEntity(savedWardrobeItem);

            return Result.ok(wardrobeItemDTO);
        } catch (error) {
            return Result.fail(error.message || 'Failed to create wardrobe item');
        }
    }
}
