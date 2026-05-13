import { IGenerationRepository } from '../../interfaces/repositories/IGenerationRepository.js';
import { GenerationMapper } from './mappers/GenerationMapper.js';
import { Generation } from '../../domain/entities/Generation.js';
import { getSupabaseClient } from './supabase.client.js';

const R2_PUBLIC_URL = (import.meta.env.VITE_R2_PUBLIC_URL || import.meta.env.VITE_R2_PUBLIC_DOMAIN || '').replace(/^https?:\/\//, '').replace(/\/$/, '');

function isR2Url(url) {
    return !!(url && R2_PUBLIC_URL && url.startsWith(`https://${R2_PUBLIC_URL}/`));
}

async function persistGenerationImageToR2(client, generation) {
    const sourceUrl = generation?.output_url;

    if (!sourceUrl) {
        throw new Error('Generation is missing an image URL');
    }

    if (isR2Url(sourceUrl)) {
        return sourceUrl;
    }

    const response = await fetch(sourceUrl);
    if (!response.ok) {
        throw new Error('Failed to download generated image');
    }

    const blob = await response.blob();
    const fileExtension = (blob.type || generation.output_type || 'image/webp').split('/')[1] || 'webp';
    const file = new File([blob], `${generation.id}.${fileExtension}`, { type: blob.type || generation.output_type || 'image/webp' });
    const folder = generation.type === 'quick_shoot' ? `gallery/generations/${generation.user_id}` : `gallery/try-on/${generation.user_id}`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const { data, error } = await client.functions.invoke('upload-to-r2', { body: formData });
    if (error || !data?.url) {
        throw new Error(error?.message || data?.error || 'Failed to persist image to R2');
    }

    return data.url;
}

/**
 * Supabase Generation Repository
 * Implements IGenerationRepository using Supabase as the data source
 */
export class GenerationRepository extends IGenerationRepository {
    constructor() {
        super();
        this.tableName = 'generations';
    }

    /**
     * Get Supabase client
     * @returns {import('@supabase/supabase-js').SupabaseClient}
     */
    get client() {
        return getSupabaseClient();
    }

    /**
     * Find a generation by ID
     * @param {string} id - Generation ID
     * @returns {Promise<Generation|null>}
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
                console.error('Error finding generation by ID:', error);
                throw new Error(`Failed to find generation: ${error.message}`);
            }

            return GenerationMapper.toDomain(data);
        } catch (error) {
            console.error('Error in findById:', error);
            throw error;
        }
    }

    /**
     * Find all generations by user ID
     * @param {string} userId - User ID
     * @param {Object} [options] - Optional filters
     * @returns {Promise<Generation[]>}
     */
    async findByUserId(userId, options = {}) {
        try {
            const { limit = 50, status, type } = options;

            let query = this.client
                .from(this.tableName)
                .select('*')
                .eq('user_id', userId);

            // Filter by status if provided
            if (status) {
                query = query.eq('status', status);
            }

            // Filter by generation type if provided
            if (type) {
                query = query.eq('type', type);
            }

            // Order by creation date (newest first)
            query = query.order('created_at', { ascending: false });

            // Limit results
            if (limit) {
                query = query.limit(limit);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error finding generations by user ID:', error);
                throw new Error(`Failed to find user generations: ${error.message}`);
            }

            return (data || []).map(row => GenerationMapper.toDomain(row));
        } catch (error) {
            console.error('Error in findByUserId:', error);
            throw error;
        }
    }

    /**
     * Find all public (published) generations
     * @param {Object} [options] - Optional filters
     * @returns {Promise<Generation[]>}
     */
    async findPublic(options = {}) {
        try {
            const { limit = 50 } = options;

            let query = this.client
                .from(this.tableName)
                .select('*')
                .eq('is_published', true)
                .eq('status', 'completed'); // Only show completed generations

            // Order by likes (popularity) and then by date
            query = query
                .order('likes', { ascending: false })
                .order('published_at', { ascending: false });

            // Limit results
            if (limit) {
                query = query.limit(limit);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error finding public generations:', error);
                throw new Error(`Failed to find public generations: ${error.message}`);
            }

            return (data || []).map(row => GenerationMapper.toDomain(row));
        } catch (error) {
            console.error('Error in findPublic:', error);
            throw error;
        }
    }

    /**
     * Save or update a generation
     * @param {Generation} generation - Generation entity
     * @returns {Promise<void>}
     */
    async save(generation) {
        try {
            if (!(generation instanceof Generation)) {
                throw new Error('Invalid generation entity');
            }

            const row = GenerationMapper.toDatabase(generation);

            const { error } = await this.client
                .from(this.tableName)
                .upsert(row, { onConflict: 'id' });

            if (error) {
                console.error('Error saving generation:', error);
                throw new Error(`Failed to save generation: ${error.message}`);
            }
        } catch (error) {
            console.error('Error in save:', error);
            throw error;
        }
    }

    /**
     * Create a new generation
     * @param {Generation} generation - Generation entity
     * @returns {Promise<Generation>}
     */
    async create(generation) {
        try {
            if (!(generation instanceof Generation)) {
                throw new Error('Invalid generation entity');
            }

            const row = GenerationMapper.toDatabase(generation);
            row.created_at = new Date().toISOString();

            const { data, error } = await this.client
                .from(this.tableName)
                .insert(row)
                .select()
                .single();

            if (error) {
                console.error('Error creating generation:', error);
                throw new Error(`Failed to create generation: ${error.message}`);
            }

            return GenerationMapper.toDomain(data);
        } catch (error) {
            console.error('Error in create:', error);
            throw error;
        }
    }

    /**
     * Delete a generation
     * @param {string} id - Generation ID
     * @returns {Promise<void>}
     */
    async delete(id) {
        try {
            const { error } = await this.client
                .from(this.tableName)
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting generation:', error);
                throw new Error(`Failed to delete generation: ${error.message}`);
            }
        } catch (error) {
            console.error('Error in delete:', error);
            throw error;
        }
    }

    /**
     * Find a gallery item by ID
     * @param {string} galleryId - Gallery ID
     * @returns {Promise<Object|null>}
     */
    async findGalleryItemById(galleryId) {
        try {
            const { data, error } = await this.client
                .from('gallery')
                .select(`
                    gallery_id,
                    generation_id,
                    title,
                    description,
                    likes,
                    tags,
                    created_at,
                    generation:generations!gallery_generations_rel (
                        id,
                        user_id,
                        model_id,
                        prompt_text,
                        output_url,
                        output_type,
                        parameters_json,
                        credits_used,
                        users:user_id (username, email),
                        models:model_id (display_name, username, profile_image_url)
                    )
                `)
                .eq('gallery_id', galleryId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null;
                throw new Error(`Failed to find gallery item: ${error.message}`);
            }

            return {
                id: data.gallery_id,
                generationId: data.generation_id,
                title: data.title,
                description: data.description,
                likesCount: data.likes,
                tags: data.tags,
                createdAt: data.created_at,
                promptText: data.generation?.prompt_text,
                outputUrl: data.generation?.output_url,
                outputType: data.generation?.output_type,
                parametersJson: data.generation?.parameters_json,
                creditsUsed: data.generation?.credits_used,
                modelId: data.generation?.model_id,
                users: data.generation?.users,
                models: data.generation?.models,
            };
        } catch (error) {
            console.error('Error in findGalleryItemById:', error);
            throw error;
        }
    }

    /**
     * Find gallery items with pagination and filters
     * @param {Object} options
     * @param {number} [options.page=0] - Page number (0-indexed)
     * @param {number} [options.limit=20] - Items per page
     * @param {string} [options.type] - Filter by output type
     * @param {string} [options.style] - Filter by style
     * @returns {Promise<Object>} { items, hasMore }
     */
    async findGalleryItems(options = {}) {
        try {
            const { page = 0, limit = 20, type, style } = options;

            let query = this.client
                .from('gallery')
                .select(`
                    gallery_id,
                    title,
                    likes,
                    tags,
                    created_at,
                    generation:generations!gallery_generations_rel (
                        id,
                        output_url,
                        output_type,
                        prompt_text,
                        parameters_json,
                        users:user_id (username, email),
                        models:model_id (display_name, username)
                    )
                `)
                .order('created_at', { ascending: false })
                .range(page * limit, (page + 1) * limit - 1);

            const { data, error } = await query;

            if (error) {
                throw new Error(`Failed to find gallery items: ${error.message}`);
            }

            const normalized = (data || [])
                .filter(row => row.generation?.output_url)
                .map(row => {
                    const mimeType = row.generation.output_type || '';
                    let uiType = 'photo';
                    if (mimeType.startsWith('video/') || row.generation.type === 'video') {
                        uiType = 'video';
                    } else if (mimeType.startsWith('image/')) {
                        uiType = 'photo';
                    }

                    return {
                        id: row.gallery_id,
                        title: row.title,
                        likesCount: row.likes,
                        tags: row.tags || [],
                        createdAt: row.created_at,
                        outputUrl: row.generation.output_url,
                        outputType: uiType, // Map to UI-friendly type
                        promptText: row.generation.prompt_text,
                        parametersJson: row.generation.parameters_json,
                        users: row.generation.users,
                        models: row.generation.models,
                    };
                })
                .filter(item => !type || type === 'all' || item.outputType === type)
                .filter(item => !style || style === 'all' || (item.tags && item.tags.includes(style)));

            return {
                items: normalized,
                hasMore: (data?.length || 0) === limit,
            };
        } catch (error) {
            console.error('Error in findGalleryItems:', error);
            throw error;
        }
    }

    /**
     * Like a gallery item (increment/decrement likes count)
     * @param {string} galleryId - Gallery ID
     * @param {number} newLikeCount - New like count
     * @returns {Promise<void>}
     */
    async updateGalleryLikes(galleryId, newLikeCount) {
        try {
            const { error } = await this.client
                .from('gallery')
                .update({ likes: newLikeCount })
                .eq('gallery_id', galleryId);

            if (error) {
                throw new Error(`Failed to update gallery likes: ${error.message}`);
            }
        } catch (error) {
            console.error('Error in updateGalleryLikes:', error);
            throw error;
        }
    }

    /**
     * Find gallery likes for a specific user
     * @param {string} userId - User ID
     * @returns {Promise<string[]>} Array of liked gallery IDs
     */
    async getUserGalleryLikes(userId) {
        try {
            const { data, error } = await this.client
                .from('user_gallery_likes')
                .select('gallery_id')
                .eq('user_id', userId);

            if (error) {
                throw new Error(`Failed to fetch user likes: ${error.message}`);
            }

            return (data || []).map(row => row.gallery_id);
        } catch (error) {
            console.error('Error in getUserGalleryLikes:', error);
            throw error;
        }
    }

    /**
     * Toggle a like for a user
     * @param {string} userId
     * @param {string} galleryId
     * @param {boolean} isCurrentlyLiked
     */
    async toggleUserGalleryLike(userId, galleryId, isCurrentlyLiked) {
        try {
            if (isCurrentlyLiked) {
                const { error } = await this.client
                    .from('user_gallery_likes')
                    .delete()
                    .eq('user_id', userId)
                    .eq('gallery_id', galleryId);
                
                if (error) throw error;
            } else {
                const { error } = await this.client
                    .from('user_gallery_likes')
                    .insert({ user_id: userId, gallery_id: galleryId });
                
                if (error) throw error;
            }
        } catch (error) {
            console.error('Error in toggleUserGalleryLike:', error);
            throw error;
        }
    }

    /**
     * Mark a generation as permanently saved
     * @param {string} generationId - Generation ID
     * @returns {Promise<void>}
     */
    async saveGeneration(generationId) {
        try {
            const { error } = await this.client
                .from(this.tableName)
                .update({ is_saved: true })
                .eq('id', generationId);

            if (error) {
                throw new Error(`Failed to save generation: ${error.message}`);
            }
        } catch (error) {
            console.error('Error in saveGeneration:', error);
            throw error;
        }
    }

    async invokeQuickShoot(body) {
        try {
            const endpoint = body.generationType === 'video' ? 'generate-video' : 'generate-quick-shoot';
            const payload = { ...body, source: 'quick_shoot' };
            const { data, error } = await this.client.functions.invoke(endpoint, { body: payload });
            if (error || !data?.success) {
                throw new Error(error?.message || data?.error || 'Generation failed');
            }
            return data;
        } catch (error) {
            console.error('Error invoking generate-quick-shoot:', error);
            throw error;
        }
    }

    async invokeTryOn(body) {
        try {
            const hasModelId = !!body.modelId;
            const hasAiCharacterId = !!body.aiCharacterId;

            if (hasModelId === hasAiCharacterId) {
                throw new Error('Try-on requires exactly one source: modelId or aiCharacterId');
            }

            const payload = { ...body, source: 'try_on' };
            const { data, error } = await this.client.functions.invoke('generate-try-on', { body: payload });

            if (error || !data?.success) {
                throw new Error(error?.message || data?.error || 'Try-on generation failed');
            }
            return data;
        } catch (error) {
            console.error('Error invoking generate-try-on:', error);
            throw error;
        }
    }

    async addToGallery({ generationId, title, description, tags, typeLabel, username }) {
        try {
            const { data: existing } = await this.client
                .from('gallery')
                .select('gallery_id')
                .eq('generation_id', generationId)
                .maybeSingle();
            if (existing) return { alreadyExists: true, galleryId: existing.gallery_id };

            const { data: generation, error: generationError } = await this.client
                .from(this.tableName)
                .select('id, user_id, type, status, output_url, output_type')
                .eq('id', generationId)
                .single();

            if (generationError || !generation) {
                throw new Error(`Failed to load generation: ${generationError?.message || 'Not found'}`);
            }

            if (generation.status !== 'completed') {
                throw new Error('Only completed generations can be added to gallery');
            }

            const persistedUrl = await persistGenerationImageToR2(this.client, generation);

            const { error: updateError } = await this.client
                .from(this.tableName)
                .update({
                    output_url: persistedUrl,
                    is_saved: true,
                })
                .eq('id', generationId);

            if (updateError) {
                throw new Error(`Failed to update generation image: ${updateError.message}`);
            }

            const { data, error } = await this.client
                .from('gallery')
                .insert({
                    generation_id: generationId,
                    title: title?.trim()?.slice(0, 120) || null,
                    description: description?.trim() || null,
                    tags: tags || [],
                    type_label: typeLabel || 'quick-shoot',
                    username: username || null,
                })
                .select()
                .single();
            if (error) throw new Error(`Failed to add to gallery: ${error.message}`);
            return { alreadyExists: false, galleryId: data.gallery_id, outputUrl: persistedUrl };
        } catch (error) {
            console.error('Error in addToGallery:', error);
            throw error;
        }
    }

    /**
     * Invoke the generate-ai-model edge function
     * @param {Object} params - Model generation parameters
     * @returns {Promise<Object>} Generation result
     */
    async invokeGenerateAIModel(params) {
        try {
            const { data, error } = await this.client.functions.invoke('generate-ai-model', {
                body: { params }
            });

            if (error || !data?.success) {
                throw new Error(error?.message || data?.error || 'Generation request failed');
            }

            return data.model;
        } catch (error) {
            console.error('Error invoking generate-ai-model:', error);
            throw error;
        }
    }
}
