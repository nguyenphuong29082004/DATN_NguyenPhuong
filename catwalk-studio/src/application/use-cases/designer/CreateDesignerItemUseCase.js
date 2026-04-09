import { UseCase, Result } from '../UseCase.js';
import { DesignerItem } from '../../../domain/entities/DesignerItem.js';
import { DesignerItemDTO } from '../../dto/DesignerDTO.js';

/**
 * Create Designer Item Use Case
 */
export class CreateDesignerItemUseCase extends UseCase {
    /**
     * @param {import('../../../interfaces/repositories/IDesignerRepository').IDesignerRepository} designerRepository
     */
    constructor(designerRepository) {
        super();
        this.designerRepository = designerRepository;
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

            // Convert to DTO
            const itemDTO = DesignerItemDTO.fromEntity(savedItem);

            return Result.ok(itemDTO);
        } catch (error) {
            return Result.fail(error.message || 'Failed to create designer item');
        }
    }
}
