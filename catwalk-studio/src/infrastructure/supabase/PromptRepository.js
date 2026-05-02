import { IPromptRepository } from '../../interfaces/repositories/IPromptRepository.js';
import { PromptMapper } from './mappers/PromptMapper.js';
import { Prompt } from '../../domain/entities/Prompt.js';
import { getSupabaseClient } from './supabase.client.js';

/**
 * Supabase Prompt Repository
 * Implements IPromptRepository using Supabase as the data source
 */
export class PromptRepository extends IPromptRepository {
    constructor() {
        super();
        this.tableName = 'prompts';
    }

    /**
     * Get Supabase client
     * @returns {import('@supabase/supabase-js').SupabaseClient}
     */
    get client() {
        return getSupabaseClient();
    }

    /**
     * Find a prompt by ID
     * @param {string} id - Prompt ID
     * @returns {Promise<Prompt|null>}
     */
    async findById(id) {
        try {
            const { data, error } = await this.client
                .from(this.tableName)
                .select('*')
                .eq('prompt_id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return null; // Not found
                }
                console.error('Error finding prompt by ID:', error);
                throw new Error(`Failed to find prompt: ${error.message}`);
            }

            return PromptMapper.toDomain(data);
        } catch (error) {
            console.error('Error in findById:', error);
            throw error;
        }
    }

    /**
     * Find all prompts owned by a user
     * @param {string} userId - User ID
     * @param {Object} [options] - Optional pagination options
     * @param {number} [options.limit] - Maximum results
     * @param {number} [options.offset] - Offset for pagination
     * @returns {Promise<Prompt[]>}
     */
    async findByUserId(userId, options = {}) {
        try {
            const { limit, offset = 0 } = options;

            let query = this.client
                .from(this.tableName)
                .select('*')
                .eq('created_by_user_id', userId)
                .order('created_at', { ascending: false });

            if (typeof limit === 'number' && limit > 0) {
                query = query.range(offset, offset + limit - 1);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error finding prompts by user ID:', error);
                throw new Error(`Failed to find user prompts: ${error.message}`);
            }

            return (data || []).map(row => PromptMapper.toDomain(row));
        } catch (error) {
            console.error('Error in findByUserId:', error);
            throw error;
        }
    }

    /**
     * Find all public and system prompts
     * @param {Object} [options] - Optional pagination options
     * @param {number} [options.limit] - Maximum results
     * @param {number} [options.offset] - Offset for pagination
     * @returns {Promise<Prompt[]>}
     */
    async findPublicAndSystem(options = {}) {
        try {
            const { limit, offset = 0 } = options;

            let query = this.client
                .from(this.tableName)
                .select('*')
                .or('is_public.eq.true,prompt_type.in.(system,platform_default)')
                .order('usage_count', { ascending: false });

            if (typeof limit === 'number' && limit > 0) {
                query = query.range(offset, offset + limit - 1);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error finding public and system prompts:', error);
                throw new Error(`Failed to find public and system prompts: ${error.message}`);
            }

            return (data || []).map(row => PromptMapper.toDomain(row));
        } catch (error) {
            console.error('Error in findPublicAndSystem:', error);
            throw error;
        }
    }

    /**
     * Create a new prompt
     * @param {Prompt} prompt - Prompt entity
     * @returns {Promise<Prompt>}
     */
    async create(prompt) {
        try {
            if (!(prompt instanceof Prompt)) {
                throw new Error('Invalid prompt entity');
            }

            const row = PromptMapper.toDatabase(prompt);
            row.created_at = new Date().toISOString();
            
            // Remove prompt_id to let Supabase generate UUID
            delete row.prompt_id;

            const { data, error } = await this.client
                .from(this.tableName)
                .insert(row)
                .select()
                .single();

            if (error) {
                console.error('Error creating prompt:', error);
                throw new Error(`Failed to create prompt: ${error.message}`);
            }

            return PromptMapper.toDomain(data);
        } catch (error) {
            console.error('Error in create:', error);
            throw error;
        }
    }

    /**
     * Save or update a prompt
     * @param {Prompt} prompt - Prompt entity
     * @returns {Promise<void>}
     */
    async save(prompt) {
        try {
            if (!(prompt instanceof Prompt)) {
                throw new Error('Invalid prompt entity');
            }

            const row = PromptMapper.toDatabase(prompt);

            const { error } = await this.client
                .from(this.tableName)
                .upsert(row, { onConflict: 'prompt_id' });

            if (error) {
                console.error('Error saving prompt:', error);
                throw new Error(`Failed to save prompt: ${error.message}`);
            }
        } catch (error) {
            console.error('Error in save:', error);
            throw error;
        }
    }

    /**
     * Delete a prompt
     * @param {string} id - Prompt ID
     * @returns {Promise<void>}
     */
    async delete(id) {
        try {
            const { error } = await this.client
                .from(this.tableName)
                .delete()
                .eq('prompt_id', id);

            if (error) {
                console.error('Error deleting prompt:', error);
                throw new Error(`Failed to delete prompt: ${error.message}`);
            }
        } catch (error) {
            console.error('Error in delete:', error);
            throw error;
        }
    }
}
