import { Prompt } from '../../../domain/entities/Prompt.js';

/**
 * Prompt Mapper
 * Maps between database rows and Prompt entities
 *
 * Database columns → Entity props:
 *   prompt_id          → id
 *   title              → name
 *   prompt_text        → promptText
 *   negative_prompt    → negativePrompt
 *   style_tags         → tags
 *   default_parameters → parametersJson
 *   prompt_type        → promptType (system | platform_default | user_saved)
 *   created_by_user_id → userId
 *   is_public          → isPublic
 *   usage_count        → useCount
 *   prompt_category    → category
 *   created_at         → createdAt
 *   updated_at         → updatedAt
 */
export class PromptMapper {
    /**
     * Convert database row to Prompt entity
     * @param {Object} row - Database row from prompts table
     * @returns {Prompt} Prompt entity
     */
    static toDomain(row) {
        if (!row) return null;

        const props = {
            userId: row.created_by_user_id,
            name: row.title || '',
            promptText: row.prompt_text,
            negativePrompt: row.negative_prompt || null,
            category: row.prompt_category || null,
            isPublic: row.is_public || false,
            isSystem: row.prompt_type === 'system',
            useCount: parseInt(row.usage_count, 10) || 0,
            tags: row.style_tags || [],
            parametersJson: row.default_parameters || {},
            metadata: row.default_parameters || {},
            createdAt: row.created_at ? new Date(row.created_at) : new Date(),
            updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
        };

        return Prompt.create(props, row.prompt_id);
    }

    /**
     * Convert Prompt entity to database row
     * @param {Prompt} prompt - Prompt entity
     * @returns {Object} Database row for prompts table
     */
    static toDatabase(prompt) {
        const row = {
            title: prompt.name,
            prompt_text: prompt.promptText,
            negative_prompt: prompt.negativePrompt || null,
            prompt_category: prompt.category || null,
            is_public: prompt.isPublic,
            prompt_type: prompt.isSystem ? 'system' : 'user_saved',
            style_tags: prompt.tags || [],
            default_parameters: prompt.parametersJson || prompt.metadata || {},
            updated_at: new Date().toISOString(),
        };

        if (prompt.id) {
            row.prompt_id = prompt.id;
        }

        if (prompt.userId) {
            row.created_by_user_id = prompt.userId;
        }

        return row;
    }
}
