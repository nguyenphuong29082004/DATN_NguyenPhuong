import { IModelRepository } from '../../interfaces/repositories/IModelRepository.js';
import { ModelMapper } from './mappers/ModelMapper.js';
import { Model } from '../../domain/entities/Model.js';
import { getSupabaseClient } from './supabase.client.js';

/**
 * Supabase Model Repository
 * Implements IModelRepository using Supabase — queries the `models` table
 */
export class ModelRepository extends IModelRepository {
    constructor() {
        super();
        this.tableName = 'models';
    }

    get client() {
        return getSupabaseClient();
    }

    /**
     * Find a model by ID (model_id)
     */
    async findById(id) {
        try {
            const { data, error } = await this.client
                .from(this.tableName)
                .select('*')
                .eq('model_id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null;
                throw new Error(`Failed to find model: ${error.message}`);
            }

            return ModelMapper.toDomain(data);
        } catch (error) {
            console.error('ModelRepository.findById:', error);
            throw error;
        }
    }

    /**
     * Find a model by username
     */
    async findByUsername(username) {
        try {
            const { data, error } = await this.client
                .from(this.tableName)
                .select('*')
                .eq('username', username)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null;
                throw new Error(`Failed to find model: ${error.message}`);
            }

            return ModelMapper.toDomain(data);
        } catch (error) {
            console.error('ModelRepository.findByUsername:', error);
            throw error;
        }
    }

    async findPublicByUsername(username) {
        try {
            const { data, error } = await this.client
                .from(this.tableName)
                .select('*')
                .eq('username', username)
                .in('status', ['active', 'in_review'])
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null;
                throw new Error(`Failed to find public model: ${error.message}`);
            }

            return ModelMapper.toDomain(data);
        } catch (error) {
            console.error('ModelRepository.findPublicByUsername:', error);
            throw error;
        }
    }

    /**
     * Find all public/active models with optional filters
     * Elite models are sorted first (SRS requirement)
     */
    async findPublic(filters = {}) {
        try {
            let query = this.client
                .from(this.tableName)
                .select('*')
                .eq('status', 'active');

            // Filter by model type (ai/real/both)
            if (filters.modelType) {
                if (filters.modelType === 'ai') {
                    query = query.eq('is_ai', true);
                } else if (filters.modelType === 'real') {
                    query = query.eq('is_ai', false);
                }
            }

            // Filter by style tags
            if (filters.styleTags && filters.styleTags.length > 0) {
                query = query.overlaps('style_tags', filters.styleTags);
            }

            // Filter elite only
            if (filters.eliteOnly) {
                query = query.eq('elite', true);
            }

            // Sort: Elite first, then created_at desc
            query = query
                .order('elite', { ascending: false })
                .order('created_at', { ascending: false });

            if (filters.limit) {
                query = query.limit(filters.limit);
            }

            const { data, error } = await query;

            if (error) {
                console.warn(`Failed to find public models from DB, using mock data. Error: ${error.message}`);
            }

            let resultData = data || [];

            // INJECT MOCK DATA FOR DEMO IF DB IS EMPTY OR ERROR OCCURRED
            if (error || resultData.length === 0) {
                resultData = [
                    {
                        model_id: 'm1',
                        username: 'elara_vanguard',
                        display_name: 'Elara Vanguard',
                        status: 'active',
                        is_ai: true,
                        profile_image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
                        style_tags: ['editorial', 'avantGarde'],
                        can_book: true,
                        location: 'London, UK',
                        price_per_image: 15.00,
                        hourly_rate: 150.00,
                        elite: true,
                        account_type: 'both'
                    },
                    {
                        model_id: 'm2',
                        username: 'jaxon_street',
                        display_name: 'Jaxon Street',
                        status: 'active',
                        is_ai: true,
                        profile_image_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
                        style_tags: ['streetwear', 'commercial'],
                        can_book: true,
                        location: 'New York, USA',
                        price_per_image: 10.00,
                        hourly_rate: 100.00,
                        elite: false,
                        account_type: 'ai_only'
                    },
                    {
                        model_id: 'm3',
                        username: 'sophia_lorenzo',
                        display_name: 'Sophia Lorenzo',
                        status: 'active',
                        is_ai: false,
                        profile_image_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
                        style_tags: ['runway', 'swimwear', 'commercial'],
                        can_book: true,
                        location: 'Milan, Italy',
                        price_per_image: 25.00,
                        hourly_rate: 300.00,
                        elite: true,
                        account_type: 'real_only'
                    },
                    {
                        model_id: 'm4',
                        username: 'chen_wei',
                        display_name: 'Chen Wei',
                        status: 'active',
                        is_ai: true,
                        profile_image_url: 'https://images.unsplash.com/photo-1542206395-9feb3edaa68d?auto=format&fit=crop&w=800&q=80',
                        style_tags: ['minimalist', 'editorial'],
                        can_book: true,
                        location: 'Tokyo, Japan',
                        price_per_image: 12.00,
                        hourly_rate: 120.00,
                        elite: false,
                        account_type: 'both'
                    },
                    {
                        model_id: 'm5',
                        username: 'isabella_rodriguez',
                        display_name: 'Isabella Rodriguez',
                        status: 'active',
                        is_ai: false,
                        profile_image_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
                        style_tags: ['commercial', 'runway'],
                        can_book: true,
                        location: 'Madrid, Spain',
                        price_per_image: 20.00,
                        hourly_rate: 200.00,
                        elite: true,
                        account_type: 'real_only'
                    },
                    {
                        model_id: 'm6',
                        username: 'zara_nox',
                        display_name: 'Zara Nox',
                        status: 'active',
                        is_ai: true,
                        profile_image_url: 'https://images.unsplash.com/photo-1509631179647-0c77331b092b?auto=format&fit=crop&w=800&q=80',
                        style_tags: ['editorial', 'avantGarde'],
                        can_book: true,
                        location: 'Berlin, Germany',
                        price_per_image: 18.00,
                        hourly_rate: 180.00,
                        elite: true,
                        account_type: 'ai_only'
                    }
                ];
            }

            return resultData.map(row => ModelMapper.toDomain(row));
        } catch (error) {
            console.error('ModelRepository.findPublic:', error);
            throw error;
        }
    }

    /**
     * Create a new model
     */
    async create(model) {
        try {
            if (!(model instanceof Model)) {
                throw new Error('Invalid model entity');
            }

            const row = ModelMapper.toDatabase(model);
            row.created_at = new Date().toISOString();

            const { data, error } = await this.client
                .from(this.tableName)
                .insert(row)
                .select()
                .single();

            if (error) {
                throw new Error(`Failed to create model: ${error.message}`);
            }

            return ModelMapper.toDomain(data);
        } catch (error) {
            console.error('ModelRepository.create:', error);
            throw error;
        }
    }

    /**
     * Save/update an existing model
     */
    async save(model) {
        try {
            if (!(model instanceof Model)) {
                throw new Error('Invalid model entity');
            }

            const row = ModelMapper.toDatabase(model);

            const { error } = await this.client
                .from(this.tableName)
                .upsert(row, { onConflict: 'model_id' });

            if (error) {
                throw new Error(`Failed to save model: ${error.message}`);
            }
        } catch (error) {
            console.error('ModelRepository.save:', error);
            throw error;
        }
    }

    async findShootable() {
        try {
            const query = this.client
                .from(this.tableName)
                .select('model_id, display_name, username, profile_image_url, elite, elite_exp_date, style_tags, price_per_image, ai_model_id, is_ai, gender, ethnicity, body_type, age_range, can_book')
                .eq('status', 'active');

            const { data, error } = await query.order('created_at', { ascending: false });
            if (error) throw new Error(`Failed to find shootable models: ${error.message}`);
            return (data || []).map(m => ({
                id: m.model_id,
                name: m.display_name || m.username || 'Unknown',
                imageUrl: m.profile_image_url,
                profileImageUrl: m.profile_image_url,
                badge: m.elite && (!m.elite_exp_date || new Date(m.elite_exp_date) > new Date()) ? 'Elite' : null,
                style: m.style_tags?.[0] || '',
                price: m.price_per_image,
                aiModelId: m.ai_model_id,
                isAi: m.is_ai,
                gender: m.gender,
                ethnicity: m.ethnicity,
                bodyType: m.body_type,
                ageRange: m.age_range,
                availability: m.can_book ? 'Available for booking' : 'Booking unavailable',
                rating: null,
            }));
        } catch (error) {
            console.error('ModelRepository.findShootable:', error);
            throw error;
        }
    }

    async findActiveAIEngines() {
        try {
            const { data, error } = await this.client
                .from('aimodel_mapper')
                .select('*')
                .eq('status', 'active');
            
            if (error) {
                // Handle missing table gracefully (e.g. if migration hasn't run)
                if (error.code === '42P01') {
                    console.warn('aimodel_mapper table missing, using fallback engine');
                    return [{
                        frontend_slug: 'flux-1-schnell',
                        frontend_name: 'Flux.1 Schnell (Fallback)',
                        cost_per_token: 1.0
                    }];
                }
                throw new Error(`Failed to find AI engines: ${error.message}`);
            }
            return data || [];
        } catch (error) {
            console.error('ModelRepository.findActiveAIEngines:', error);
            throw error;
        }
    }

    /**
     * Delete a model by ID
     */
    async delete(id) {
        try {
            const { error } = await this.client
                .from(this.tableName)
                .delete()
                .eq('model_id', id);

            if (error) {
                throw new Error(`Failed to delete model: ${error.message}`);
            }
        } catch (error) {
            console.error('ModelRepository.delete:', error);
            throw error;
        }
    }
}
