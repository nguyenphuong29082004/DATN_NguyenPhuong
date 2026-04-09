/**
 * Prompt Data Transfer Objects (DTOs)
 */

/**
 * Prompt DTO
 * Used for returning prompt data to the UI
 */
export class PromptDTO {
    constructor(data) {
        this.id = data.id;
        this.userId = data.userId;
        this.name = data.name;
        this.promptText = data.promptText;
        this.negativePrompt = data.negativePrompt || null;
        this.parametersJson = data.parametersJson || {};
        this.description = data.description;
        this.category = data.category;
        this.isPublic = data.isPublic;
        this.isSystem = data.isSystem;
        this.useCount = data.useCount;
        this.tags = data.tags;
        this.metadata = data.metadata;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    static fromEntity(prompt) {
        return new PromptDTO({
            id: prompt.id,
            userId: prompt.userId,
            name: prompt.name,
            promptText: prompt.promptText,
            negativePrompt: prompt.negativePrompt,
            parametersJson: prompt.parametersJson,
            description: prompt.description,
            category: prompt.category,
            isPublic: prompt.isPublic,
            isSystem: prompt.isSystem,
            useCount: prompt.useCount,
            tags: prompt.tags,
            metadata: prompt.metadata,
            createdAt: prompt.createdAt,
            updatedAt: prompt.updatedAt,
        });
    }
}
