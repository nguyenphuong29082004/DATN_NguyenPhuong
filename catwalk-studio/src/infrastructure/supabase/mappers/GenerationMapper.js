import { Generation } from '../../../domain/entities/Generation.js';

/**
 * Generation Mapper
 * Maps between database rows and Generation entities
 *
 * DB columns (generations table):
 *   id, user_id, campaign_id, model_id, ai_model_id, prompt_id,
 *   prompt_text, parameters_json, output_url, output_type,
 *   credits_used, created_at, status, replicate_job_id, error_message, type
 */
export class GenerationMapper {
    /**
     * Convert database row to Generation entity
     * @param {Object} row - Database row from generations table
     * @returns {Generation} Generation entity
     */
    static toDomain(row) {
        if (!row) return null;

        const props = {
            userId: row.user_id,
            modelId: row.model_id,
            prompt: row.prompt_text || 'Untitled',
            imageUrl: row.output_url,
            status: row.status || 'pending',
            isPublished: false,
            likes: 0,
            quality: 'standard',
            settings: row.parameters_json || {},
            errorMessage: row.error_message,
            outputType: row.output_type || null,
            creditsUsed: row.credits_used || 0,
            aiModelId: row.ai_model_id || null,
            type: row.type || null,
            generationType: row.generation_type || 'photo',
            durationMs: row.duration_ms || null,
            apiCost: row.api_cost || null,
            createdAt: row.created_at ? new Date(row.created_at) : new Date(),
            updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
            publishedAt: null,
        };

        return Generation.create(props, row.id);
    }

    /**
     * Convert Generation entity to database row
     * Only includes columns that exist in the generations table
     * @param {Generation} generation - Generation entity
     * @returns {Object} Database row for generations table
     */
    static toDatabase(generation) {
        return {
            id: generation.id,
            user_id: generation.userId,
            model_id: generation.modelId,
            prompt_text: generation.prompt,
            output_url: generation.imageUrl,
            status: generation.status,
            parameters_json: generation.settings,
            error_message: generation.errorMessage,
            output_type: generation.outputType || null,
            credits_used: generation.creditsUsed || 0,
            ai_model_id: generation.aiModelId || null,
            type: generation.type || null,
            generation_type: generation.generationType || 'photo',
            duration_ms: generation.durationMs || null,
            api_cost: generation.apiCost || null,
        };
    }

    /**
     * Convert database row to DTO-compatible object (bypasses entity layer)
     * Useful for direct mapping when entity validation is too strict
     * @param {Object} row - Database row
     * @returns {Object} DTO-compatible object
     */
    static toDTO(row) {
        if (!row) return null;

        return {
            id: row.id,
            userId: row.user_id,
            modelId: row.model_id,
            prompt: row.prompt_text || '',
            imageUrl: row.output_url,
            status: row.status || 'pending',
            isPublished: false,
            likes: 0,
            quality: 'standard',
            settings: row.parameters_json || {},
            errorMessage: row.error_message,
            outputType: row.output_type || null,
            creditsUsed: row.credits_used || 0,
            aiModelId: row.ai_model_id || null,
            type: row.type || null,
            generationType: row.generation_type || 'photo',
            durationMs: row.duration_ms || null,
            apiCost: row.api_cost || null,
            createdAt: row.created_at ? new Date(row.created_at) : new Date(),
            updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
            publishedAt: null,
        };
    }
}
