import { AIModel } from '../../../domain/entities/AIModel.js';

/**
 * AIModel Mapper
 * Maps between database rows and AIModel entities
 */
export class AIModelMapper {
    /**
     * Convert database row to AIModel entity
     * @param {Object} row - Database row from ai_models table
     * @returns {AIModel} AIModel entity
     */
    static toDomain(row) {
        if (!row) return null;

        const props = {
            userId: row.user_id,
            name: row.name,
            description: row.description || '',
            thumbnailUrl: row.thumbnail_url,
            gender: row.gender || 'unisex',
            ethnicity: row.ethnicity,
            ageRange: row.age_range,
            isPublic: row.is_public || false,
            usageCount: row.usage_count || 0,
            likes: row.likes || 0,
            tags: row.tags || [],
            metadata: row.metadata || {},
            generationStatus: row.generation_status || 'idle',
            replicateJobId: row.replicate_job_id || null,
            generationStartedAt: row.generation_started_at ? new Date(row.generation_started_at) : null,
            generationError: row.generation_error || null,
            prompt: row.prompt || null,
            parametersJson: row.parameters_json || {},
            createdAt: row.created_at ? new Date(row.created_at) : new Date(),
            updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
        };

        return AIModel.create(props, row.id);
    }

    /**
     * Convert AIModel entity to database row
     * @param {AIModel} model - AIModel entity
     * @returns {Object} Database row for ai_models table
     */
    static toDatabase(model) {
        return {
            id: model.id,
            user_id: model.userId,
            name: model.name,
            description: model.description,
            thumbnail_url: model.thumbnailUrl,
            gender: model.gender,
            ethnicity: model.ethnicity,
            age_range: model.ageRange,
            is_public: model.isPublic,
            usage_count: model.usageCount,
            likes: model.likes,
            tags: model.tags,
            metadata: model.metadata,
            generation_status: model.generationStatus,
            replicate_job_id: model.replicateJobId,
            generation_started_at: model.generationStartedAt ? model.generationStartedAt.toISOString() : null,
            generation_error: model.generationError,
            prompt: model.prompt,
            parameters_json: model.parametersJson,
            updated_at: new Date().toISOString(),
        };
    }

    /**
     * Convert database row to DTO (for direct DTO mapping if needed)
     * @param {Object} row - Database row
     * @returns {Object} DTO-compatible object
     */
    static toDTO(row) {
        if (!row) return null;

        return {
            id: row.id,
            userId: row.user_id,
            name: row.name,
            description: row.description || '',
            thumbnailUrl: row.thumbnail_url,
            gender: row.gender || 'unisex',
            ethnicity: row.ethnicity,
            ageRange: row.age_range,
            isPublic: row.is_public || false,
            usageCount: row.usage_count || 0,
            likes: row.likes || 0,
            tags: row.tags || [],
            metadata: row.metadata || {},
            generationStatus: row.generation_status || 'idle',
            replicateJobId: row.replicate_job_id || null,
            generationStartedAt: row.generation_started_at ? new Date(row.generation_started_at) : null,
            generationError: row.generation_error || null,
            prompt: row.prompt || null,
            parametersJson: row.parameters_json || {},
            createdAt: row.created_at ? new Date(row.created_at) : new Date(),
            updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
        };
    }
}
