import { ICampaignRepository } from '../../interfaces/repositories/ICampaignRepository.js';
import { CampaignMapper } from './mappers/CampaignMapper.js';
import { Campaign } from '../../domain/entities/Campaign.js';
import { getSupabaseClient } from './supabase.client.js';

/**
 * Supabase Campaign Repository
 * Implements ICampaignRepository using Supabase as the data source
 */
export class CampaignRepository extends ICampaignRepository {
    constructor() {
        super();
        this.tableName = 'campaigns';
    }

    /**
     * Get Supabase client
     * @returns {import('@supabase/supabase-js').SupabaseClient}
     */
    get client() {
        return getSupabaseClient();
    }

    /**
     * Find a campaign by ID
     * @param {string} id - Campaign ID
     * @returns {Promise<Campaign|null>}
     */
    async findById(id) {
        try {
            const { data, error } = await this.client
                .from(this.tableName)
                .select('*')
                .eq('campaign_id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null;
                throw new Error(`Failed to find campaign: ${error.message}`);
            }

            return CampaignMapper.toDomain(data);
        } catch (error) {
            console.error('Error in findById:', error);
            throw error;
        }
    }

    /**
     * Find a campaign by ID with generation count
     * @param {string} id - Campaign ID
     * @returns {Promise<Campaign|null>}
     */
    async findByIdWithGenerationCount(id) {
        try {
            const { data, error } = await this.client
                .from(this.tableName)
                .select('*, generated_content(count)')
                .eq('campaign_id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null;
                throw new Error(`Failed to find campaign: ${error.message}`);
            }

            return CampaignMapper.toDomainWithCount(data);
        } catch (error) {
            console.error('Error in findByIdWithGenerationCount:', error);
            throw error;
        }
    }

    /**
     * Find all campaigns by user ID
     * @param {string} userId - User ID
     * @param {Object} [options] - Optional filters
     * @param {string} [options.status] - Filter by status
     * @param {boolean} [options.includeGenerationCount] - Include generation count
     * @returns {Promise<Campaign[]>}
     */
    async findByUserId(userId, options = {}) {
        try {
            const { status, includeGenerationCount } = options;

            const selectQuery = includeGenerationCount
                ? '*, generated_content(count)'
                : '*';

            let query = this.client
                .from(this.tableName)
                .select(selectQuery)
                .eq('user_id', userId);

            // Filter by status if provided
            if (status) {
                query = query.eq('status', status);
            }

            // Order by creation date (newest first)
            query = query.order('created_at', { ascending: false });

            const { data, error } = await query;

            if (error) {
                throw new Error(`Failed to find campaigns: ${error.message}`);
            }

            const mapper = includeGenerationCount
                ? CampaignMapper.toDomainWithCount
                : CampaignMapper.toDomain;

            return (data || []).map(row => mapper(row));
        } catch (error) {
            console.error('Error in findByUserId:', error);
            throw error;
        }
    }

    /**
     * Create a new campaign
     * @param {Campaign} campaign - Campaign entity
     * @returns {Promise<Campaign>}
     */
    async create(campaign) {
        try {
            if (!(campaign instanceof Campaign)) {
                throw new Error('Invalid campaign entity');
            }

            const row = CampaignMapper.toDatabase(campaign);

            const { data, error } = await this.client
                .from(this.tableName)
                .insert(row)
                .select()
                .single();

            if (error) {
                throw new Error(`Failed to create campaign: ${error.message}`);
            }

            return CampaignMapper.toDomain(data);
        } catch (error) {
            console.error('Error in create:', error);
            throw error;
        }
    }

    /**
     * Save or update a campaign
     * @param {Campaign} campaign - Campaign entity
     * @returns {Promise<void>}
     */
    async save(campaign) {
        try {
            if (!(campaign instanceof Campaign)) {
                throw new Error('Invalid campaign entity');
            }

            const row = CampaignMapper.toDatabase(campaign);

            const { error } = await this.client
                .from(this.tableName)
                .upsert(row, { onConflict: 'campaign_id' });

            if (error) {
                throw new Error(`Failed to save campaign: ${error.message}`);
            }
        } catch (error) {
            console.error('Error in save:', error);
            throw error;
        }
    }

    /**
     * Delete a campaign
     * @param {string} id - Campaign ID
     * @returns {Promise<void>}
     */
    async delete(id) {
        try {
            const { error } = await this.client
                .from(this.tableName)
                .delete()
                .eq('campaign_id', id);

            if (error) {
                throw new Error(`Failed to delete campaign: ${error.message}`);
            }
        } catch (error) {
            console.error('Error in delete:', error);
            throw error;
        }
    }
}
