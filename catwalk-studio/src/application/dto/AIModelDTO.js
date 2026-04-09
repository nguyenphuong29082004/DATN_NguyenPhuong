/**
 * AI Model Data Transfer Objects (DTOs)
 */

/**
 * AI Model DTO
 * Used for returning model data to the UI
 */
export class AIModelDTO {
    constructor(data) {
        this.id = data.id;
        this.userId = data.userId;
        this.name = data.name;
        this.description = data.description;
        this.thumbnailUrl = data.thumbnailUrl;
        this.gender = data.gender;
        this.ethnicity = data.ethnicity;
        this.ageRange = data.ageRange;
        this.isPublic = data.isPublic;
        this.usageCount = data.usageCount;
        this.likes = data.likes;
        this.tags = data.tags;
        this.metadata = data.metadata;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    static fromEntity(model) {
        return new AIModelDTO({
            id: model.id,
            userId: model.userId,
            name: model.name,
            description: model.description,
            thumbnailUrl: model.thumbnailUrl,
            gender: model.gender,
            ethnicity: model.ethnicity,
            ageRange: model.ageRange,
            isPublic: model.isPublic,
            usageCount: model.usageCount,
            likes: model.likes,
            tags: model.tags,
            metadata: model.metadata,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
        });
    }
}

/**
 * Create AI Model Input DTO
 */
export class CreateAIModelDTO {
    constructor(data) {
        this.userId = data.userId;
        this.name = data.name;
        this.description = data.description || '';
        this.thumbnailUrl = data.thumbnailUrl || null;
        this.gender = data.gender || 'unisex';
        this.ethnicity = data.ethnicity || null;
        this.ageRange = data.ageRange || null;
        this.isPublic = data.isPublic || false;
        this.tags = data.tags || [];
        this.metadata = data.metadata || {};
    }
}

/**
 * Update AI Model Input DTO
 */
export class UpdateAIModelDTO {
    constructor(data) {
        this.modelId = data.modelId;
        this.name = data.name;
        this.description = data.description;
        this.thumbnailUrl = data.thumbnailUrl;
        this.gender = data.gender;
        this.ethnicity = data.ethnicity;
        this.ageRange = data.ageRange;
        this.tags = data.tags;
        this.metadata = data.metadata;
    }
}
