import { IAIModelRepository } from '../../interfaces/repositories/IAIModelRepository.js';
import { AIModelMapper } from './mappers/AIModelMapper.js';
import { AIModel } from '../../domain/entities/AIModel.js';
import { getSupabaseClient } from './supabase.client.js';

/**
 * Supabase AI Model Repository
 * Implements IAIModelRepository using Supabase as the data source
 */
export class AIModelRepository extends IAIModelRepository {
    constructor() {
        super();
        this.tableName = 'ai_models';
    }

    /**
     * Get Supabase client
     * @returns {import('@supabase/supabase-js').SupabaseClient}
     */
    get client() {
        return getSupabaseClient();
    }

    /**
     * Find a model by ID
     * @param {string} id - Model ID
     * @returns {Promise<AIModel|null>}
     */
    async findById(id) {
        try {
            const { data, error } = await this.client
                .from(this.tableName)
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return null; // Not found
                }
                console.error('Error finding model by ID:', error);
                throw new Error(`Failed to find model: ${error.message}`);
            }

            return AIModelMapper.toDomain(data);
        } catch (error) {
            console.error('Error in findById:', error);
            throw error;
        }
    }

    /**
     * Find all models owned by a user
     * @param {string} userId - User ID
     * @returns {Promise<AIModel[]>}
     */
    async findByUserId(userId) {
        try {
            const { data, error } = await this.client
                .from(this.tableName)
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error finding models by user ID:', error);
                throw new Error(`Failed to find user models: ${error.message}`);
            }

            return (data || []).map(row => AIModelMapper.toDomain(row));
        } catch (error) {
            console.error('Error in findByUserId:', error);
            throw error;
        }
    }

    /**
     * Find all public models (optionally filtered)
     * @param {Object} [filters] - Optional filters
     * @returns {Promise<AIModel[]>}
     */
    async findPublic(filters = {}) {
        try {
            let query = this.client
                .from(this.tableName)
                .select('*')
                .eq('is_public', true);

            // Apply filters
            if (filters.gender) {
                query = query.eq('gender', filters.gender);
            }

            if (filters.ethnicity) {
                query = query.eq('ethnicity', filters.ethnicity);
            }

            if (filters.tags && filters.tags.length > 0) {
                // Supabase array contains query
                query = query.contains('tags', filters.tags);
            }

            // Order by likes (popularity)
            query = query.order('likes', { ascending: false });

            // Limit results
            if (filters.limit) {
                query = query.limit(filters.limit);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error finding public models:', error);
                throw new Error(`Failed to find public models: ${error.message}`);
            }

            return (data || []).map(row => AIModelMapper.toDomain(row));
        } catch (error) {
            console.error('Error in findPublic:', error);
            throw error;
        }
    }

    /**
     * Save or update a model
     * @param {AIModel} model - Model entity
     * @returns {Promise<void>}
     */
    async save(model) {
        try {
            if (!(model instanceof AIModel)) {
                throw new Error('Invalid model entity');
            }

            const row = AIModelMapper.toDatabase(model);

            const { error } = await this.client
                .from(this.tableName)
                .upsert(row, { onConflict: 'id' });

            if (error) {
                console.error('Error saving model:', error);
                throw new Error(`Failed to save model: ${error.message}`);
            }
        } catch (error) {
            console.error('Error in save:', error);
            throw error;
        }
    }

    /**
     * Create a new model
     * @param {AIModel} model - Model entity
     * @returns {Promise<AIModel>}
     */
    async create(model) {
        try {
            if (!(model instanceof AIModel)) {
                throw new Error('Invalid model entity');
            }

            const row = AIModelMapper.toDatabase(model);
            row.created_at = new Date().toISOString();

            const { data, error } = await this.client
                .from(this.tableName)
                .insert(row)
                .select()
                .single();

            if (error) {
                console.error('Error creating model:', error);
                throw new Error(`Failed to create model: ${error.message}`);
            }

            return AIModelMapper.toDomain(data);
        } catch (error) {
            console.error('Error in create:', error);
            throw error;
        }
    }

    /**
     * Delete a model
     * @param {string} id - Model ID
     * @returns {Promise<void>}
     */
    async delete(id) {
        try {
            const { error } = await this.client
                .from(this.tableName)
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting model:', error);
                throw new Error(`Failed to delete model: ${error.message}`);
            }
        } catch (error) {
            console.error('Error in delete:', error);
            throw error;
        }
    }

    async findUserCharacters(userId) {
        if (!userId) return [];
        try {
            const { data, error } = await this.client
                .from(this.tableName)
                .select('id, name, preview_images, parameters_json, created_at, generations(output_url)')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            if (error) throw new Error(`Failed to find user characters: ${error.message}`);
            return (data || []).map(c => {
                const previewUrl = c.preview_images?.[0]
                    || c.generations?.find(g => g.output_url)?.output_url
                    || null;
                return {
                    id: c.id,
                    name: c.name || 'AI Model',
                    imageUrl: previewUrl,
                    style: c.parameters_json?.style || '',
                    isUserAiCharacter: true,
                };
            });
        } catch (error) {
            console.error('AIModelRepository.findUserCharacters:', error);
            throw error;
        }
    }

    /**
     * Find models currently processing for a user
     * Used to recover pending generation jobs after page reload
     * @param {string} userId - User ID
     * @returns {Promise<AIModel[]>}
     */
    async findProcessingByUserId(userId) {
        try {
            const { data, error } = await this.client
                .from(this.tableName)
                .select('*')
                .eq('user_id', userId)
                .eq('generation_status', 'processing')
                .order('generation_started_at', { ascending: false });

            if (error) {
                console.error('Error finding processing models:', error);
                throw new Error(`Failed to find processing models: ${error.message}`);
            }

            return (data || []).map(row => AIModelMapper.toDomain(row));
        } catch (error) {
            console.error('Error in findProcessingByUserId:', error);
            throw error;
        }
    }

    /**
     * Update generation status of a model (lightweight update, no full entity needed)
     * @param {string} id - Model ID
     * @param {Object} statusData - Status fields to update
     * @param {string} statusData.generation_status
     * @param {string} [statusData.thumbnail_url]
     * @param {string} [statusData.generation_error]
     * @param {string} [statusData.replicate_job_id]
     * @returns {Promise<Object>} Updated row
     */
    async updateGenerationStatus(id, statusData) {
        try {
            const { data, error } = await this.client
                .from(this.tableName)
                .update({
                    ...statusData,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error('Error updating generation status:', error);
                throw new Error(`Failed to update generation status: ${error.message}`);
            }

            return data;
        } catch (error) {
            console.error('Error in updateGenerationStatus:', error);
            throw error;
        }
    }
}
