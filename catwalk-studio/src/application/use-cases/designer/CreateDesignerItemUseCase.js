import { UseCase, Result } from '../UseCase.js';
import { DesignerItem } from '../../../domain/entities/DesignerItem.js';
import { WardrobeItem } from '../../../domain/entities/WardrobeItem.js';
import { DesignerItemDTO } from '../../dto/DesignerDTO.js';

/**
 * Create Designer Item Use Case
 */
export class CreateDesignerItemUseCase extends UseCase {
    /**
     * @param {import('../../../interfaces/repositories/IDesignerRepository').IDesignerRepository} designerRepository
     * @param {import('../../../interfaces/repositories/IWardrobeRepository').IWardrobeRepository} wardrobeRepository
     */
    constructor(designerRepository, wardrobeRepository) {
        super();
        this.designerRepository = designerRepository;
        this.wardrobeRepository = wardrobeRepository;
    }

    /**
     * Execute the use case
     * @param {Object} input - Item creation input
     * @returns {Promise<Result>} Result with created item DTO
     */
    async execute(input) {
        try {
            const { userId, name, category, description, imageUrl, color, brand, tags, metadata } = input;

            if (!userId) {
                return Result.fail('User ID is required');
            }

            if (!name || name.trim() === '') {
                return Result.fail('Item name is required');
            }

            if (!category) {
                return Result.fail('Category is required');
            }

            // Create item entity
            const item = DesignerItem.create({
                userId,
                name: name.trim(),
                category,
                description: description || '',
                imageUrl: imageUrl || null,
                color: color || null,
                brand: brand || null,
                tags: tags || [],
                metadata: metadata || {},
            });

            // Save item
            const savedItem = await this.designerRepository.createItem(item);

            // Sync to wardrobe so it can be used in Try-on
            try {
                const wardrobeItem = WardrobeItem.create({
                    userId,
                    title: name.trim(),
                    category: category.toLowerCase(),
                    brand: brand || 'Designer',
                    thumbnailUrl: imageUrl || null,
                    highResImageUrl: imageUrl || null,
                    colour: color || null,
                    description: description || '',
                    isUserUploaded: true,
                    isStock: false
                });
                await this.wardrobeRepository.create(wardrobeItem);
            } catch (syncError) {
                console.error('Failed to sync designer item to wardrobe:', syncError);
                // We don't fail the whole operation if wardrobe sync fails, 
                // but ideally it should work.
            }

            // Convert to DTO
            const itemDTO = DesignerItemDTO.fromEntity(savedItem);

            return Result.ok(itemDTO);
        } catch (error) {
            return Result.fail(error.message || 'Failed to create designer item');
        }
    }
}
