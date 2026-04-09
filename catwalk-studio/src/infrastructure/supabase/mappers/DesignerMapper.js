import { Collection } from '../../../domain/entities/Collection.js';
import { DesignerItem } from '../../../domain/entities/DesignerItem.js';

/**
 * Designer Mapper
 * Maps between database rows and Designer entities
 */
export class DesignerMapper {
    // ========================================================
    // Collection Mapping
    // ========================================================

    /**
     * Convert database row to Collection entity
     * @param {Object} row - Database row from designer_collections table
     * @returns {Collection} Collection entity
     */
    static collectionToDomain(row) {
        if (!row) return null;

        const props = {
            userId: row.user_id,
            name: row.name,
            description: row.description || '',
            isPublic: row.is_public || false,
            itemIds: row.item_ids || [],
            likes: row.likes || 0,
            tags: row.tags || [],
            createdAt: row.created_at ? new Date(row.created_at) : new Date(),
            updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
        };

        return Collection.create(props, row.id);
    }

    /**
     * Convert Collection entity to database row
     * @param {Collection} collection - Collection entity
     * @returns {Object} Database row for designer_collections table
     */
    static collectionToDatabase(collection) {
        return {
            id: collection.id,
            user_id: collection.userId,
            name: collection.name,
            description: collection.description,
            is_public: collection.isPublic,
            item_ids: collection.itemIds,
            likes: collection.likes,
            tags: collection.tags,
            updated_at: new Date().toISOString(),
        };
    }

    // ========================================================
    // Item Mapping
    // ========================================================

    /**
     * Convert database row to DesignerItem entity
     * @param {Object} row - Database row from designer_items table
     * @returns {DesignerItem} DesignerItem entity
     */
    static itemToDomain(row) {
        if (!row) return null;

        const props = {
            userId: row.user_id,
            name: row.name,
            category: row.category,
            description: row.description || '',
            imageUrl: row.image_url,
            color: row.color,
            brand: row.brand,
            tags: row.tags || [],
            metadata: row.metadata || {},
            createdAt: row.created_at ? new Date(row.created_at) : new Date(),
            updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
        };

        return DesignerItem.create(props, row.id);
    }

    /**
     * Convert DesignerItem entity to database row
     * @param {DesignerItem} item - DesignerItem entity
     * @returns {Object} Database row for designer_items table
     */
    static itemToDatabase(item) {
        return {
            id: item.id,
            user_id: item.userId,
            name: item.name,
            category: item.category,
            description: item.description,
            image_url: item.imageUrl,
            color: item.color,
            brand: item.brand,
            tags: item.tags,
            metadata: item.metadata,
            updated_at: new Date().toISOString(),
        };
    }
}
