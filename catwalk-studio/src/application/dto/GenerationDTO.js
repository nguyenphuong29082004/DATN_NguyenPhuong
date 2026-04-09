/**
 * Generation Data Transfer Objects (DTOs)
 */

/**
 * Generation DTO
 * Used for returning generation data to the UI
 */
export class GenerationDTO {
    constructor(data) {
        this.id = data.id;
        this.userId = data.userId;
        this.modelId = data.modelId;
        this.prompt = data.prompt;
        this.imageUrl = data.imageUrl;
        this.status = data.status;
        this.isPublished = data.isPublished;
        this.likes = data.likes;
        this.quality = data.quality;
        this.settings = data.settings;
        this.errorMessage = data.errorMessage;
        this.outputType = data.outputType;
        this.creditsUsed = data.creditsUsed;
        this.aiModelId = data.aiModelId;
        this.type = data.type;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
        this.publishedAt = data.publishedAt;
    }

    static fromEntity(generation) {
        return new GenerationDTO({
            id: generation.id,
            userId: generation.userId,
            modelId: generation.modelId,
            prompt: generation.prompt,
            imageUrl: generation.imageUrl,
            status: generation.status,
            isPublished: generation.isPublished,
            likes: generation.likes,
            quality: generation.quality,
            settings: generation.settings,
            errorMessage: generation.errorMessage,
            outputType: generation.outputType,
            creditsUsed: generation.creditsUsed,
            aiModelId: generation.aiModelId,
            type: generation.type,
            createdAt: generation.createdAt,
            updatedAt: generation.updatedAt,
            publishedAt: generation.publishedAt,
        });
    }
}

/**
 * Generate Quick Shoot Input DTO
 */
export class GenerateQuickShootDTO {
    constructor(data) {
        this.userId = data.userId;
        this.modelId = data.modelId || null;
        this.prompt = data.prompt;
        this.quality = data.quality || 'standard';
        this.settings = data.settings || {};
    }
}

/**
 * Publish to Gallery Input DTO
 */
export class PublishToGalleryDTO {
    constructor(data) {
        this.generationId = data.generationId;
        this.userId = data.userId;
    }
}
