/**
 * Designer Data Transfer Objects (DTOs)
 */

/**
 * Collection DTO
 */
export class CollectionDTO {
    constructor(data) {
        this.id = data.id;
        this.userId = data.userId;
        this.name = data.name;
        this.description = data.description;
        this.isPublic = data.isPublic;
        this.itemIds = data.itemIds;
        this.likes = data.likes;
        this.tags = data.tags;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    static fromEntity(collection) {
        return new CollectionDTO({
            id: collection.id,
            userId: collection.userId,
            name: collection.name,
            description: collection.description,
            isPublic: collection.isPublic,
            itemIds: collection.itemIds,
            likes: collection.likes,
            tags: collection.tags,
            createdAt: collection.createdAt,
            updatedAt: collection.updatedAt,
        });
    }
}

/**
 * DesignerItem DTO
 */
export class DesignerItemDTO {
    constructor(data) {
        this.id = data.id;
        this.userId = data.userId;
        this.name = data.name;
        this.category = data.category;
        this.description = data.description;
        this.imageUrl = data.imageUrl;
        this.color = data.color;
        this.brand = data.brand;
        this.tags = data.tags;
        this.metadata = data.metadata;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    static fromEntity(item) {
        return new DesignerItemDTO({
            id: item.id,
            userId: item.userId,
            name: item.name,
            category: item.category,
            description: item.description,
            imageUrl: item.imageUrl,
            color: item.color,
            brand: item.brand,
            tags: item.tags,
            metadata: item.metadata,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
        });
    }
}

/**
 * Create Collection Input DTO
 */
export class CreateCollectionDTO {
    constructor(data) {
        this.userId = data.userId;
        this.name = data.name;
        this.description = data.description || '';
        this.isPublic = data.isPublic || false;
        this.itemIds = data.itemIds || [];
        this.tags = data.tags || [];
    }
}

/**
 * Create DesignerItem Input DTO
 */
export class CreateDesignerItemDTO {
    constructor(data) {
        this.userId = data.userId;
        this.name = data.name;
        this.category = data.category;
        this.description = data.description || '';
        this.imageUrl = data.imageUrl || null;
        this.color = data.color || null;
        this.brand = data.brand || null;
        this.tags = data.tags || [];
        this.metadata = data.metadata || {};
    }
}
