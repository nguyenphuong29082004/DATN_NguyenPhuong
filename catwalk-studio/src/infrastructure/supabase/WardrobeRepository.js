import { IWardrobeRepository } from '../../interfaces/repositories/IWardrobeRepository.js';
import { WardrobeItemMapper } from './mappers/WardrobeItemMapper.js';
import { WardrobeItem } from '../../domain/entities/WardrobeItem.js';
import { getSupabaseClient } from './supabase.client.js';

/**
 * Supabase Wardrobe Repository
 * Implements IWardrobeRepository using Supabase as the data source
 * Points to the new wardrobe_items table
 */
export class WardrobeRepository extends IWardrobeRepository {
    constructor() {
        super();
        this.tableName = 'wardrobe_items';
    }

    /**
     * Get Supabase client
     * @returns {import('@supabase/supabase-js').SupabaseClient}
     */
    get client() {
        return getSupabaseClient();
    }

    /**
     * Find a wardrobe item by ID
     * @param {string} id - Wardrobe item ID (item_id)
     * @returns {Promise<WardrobeItem|null>}
     */
    async findById(id) {
        try {
            const { data, error } = await this.client
                .from(this.tableName)
                .select('*')
                .eq('item_id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return null; // Not found
                }
                console.error('Error finding wardrobe item by ID:', error);
                throw new Error(`Failed to find wardrobe item: ${error.message}`);
            }

            return WardrobeItemMapper.toDomain(data);
        } catch (error) {
            console.error('Error in findById:', error);
            throw error;
        }
    }

    /**
     * Find all wardrobe items owned by a user
     * @param {string} userId - User ID
     * @param {Object} [options] - Optional filters and pagination
     * @param {string} [options.category] - Category filter
     * @param {number} [options.limit] - Maximum results
     * @param {number} [options.offset] - Offset for pagination
     * @returns {Promise<WardrobeItem[]>}
     */
    async findByUserId(userId, options = {}) {
        try {
            const { categories = [], limit, offset = 0 } = options;

            let query = this.client
                .from(this.tableName)
                .select('*')
                .eq('user_id', userId)
                .eq('is_user_uploaded', true)
                .order('created_at', { ascending: false });

            if (categories.length > 0) {
                const caseInsensitiveCategories = categories.flatMap(c => [
                    c.toLowerCase(),
                    c.charAt(0).toUpperCase() + c.slice(1).toLowerCase()
                ]);
                query = query.in('category', caseInsensitiveCategories);
            }

            if (typeof limit === 'number' && limit > 0) {
                query = query.range(offset, offset + limit - 1);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error finding wardrobe items by user ID:', error);
                throw new Error(`Failed to find user wardrobe items: ${error.message}`);
            }

            return (data || []).map(row => WardrobeItemMapper.toDomain(row));
        } catch (error) {
            console.error('Error in findByUserId:', error);
            throw error;
        }
    }

    /**
     * Find all public/stock wardrobe items (platform defaults)
     * @param {Object} [options] - Optional filters and pagination
     * @param {string} [options.category] - Category filter
     * @param {number} [options.limit] - Maximum results
     * @param {number} [options.offset] - Offset for pagination
     * @returns {Promise<WardrobeItem[]>}
     */
    async findPublicAndDefault(options = {}) {
        try {
            const { categories = [], limit, offset = 0 } = options;

            let query = this.client
                .from(this.tableName)
                .select('*')
                .eq('is_stock', true)
                .order('created_at', { ascending: false });

            if (categories.length > 0) {
                const caseInsensitiveCategories = categories.flatMap(c => [
                    c.toLowerCase(),
                    c.charAt(0).toUpperCase() + c.slice(1).toLowerCase()
                ]);
                query = query.in('category', caseInsensitiveCategories);
            }

            if (typeof limit === 'number' && limit > 0) {
                query = query.range(offset, offset + limit - 1);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error finding stock wardrobe items:', error);
                throw new Error(`Failed to find stock wardrobe items: ${error.message}`);
            }

            return (data || []).map(row => WardrobeItemMapper.toDomain(row));
        } catch (error) {
            console.error('Error in findPublicAndDefault:', error);
            throw error;
        }
    }

    /**
     * Create a new wardrobe item
     * @param {WardrobeItem} wardrobeItem - WardrobeItem entity
     * @returns {Promise<WardrobeItem>}
     */
    async create(wardrobeItem) {
        try {
            if (!(wardrobeItem instanceof WardrobeItem)) {
                throw new Error('Invalid wardrobe item entity');
            }

            const row = WardrobeItemMapper.toDatabase(wardrobeItem, false);
            row.created_at = new Date().toISOString();

            const { data, error } = await this.client
                .from(this.tableName)
                .insert(row)
                .select()
                .single();

            if (error) {
                console.error('Error creating wardrobe item:', error);
                throw new Error(`Failed to create wardrobe item: ${error.message}`);
            }

            return WardrobeItemMapper.toDomain(data);
        } catch (error) {
            console.error('Error in create:', error);
            throw error;
        }
    }

    /**
     * Save or update a wardrobe item
     * @param {WardrobeItem} wardrobeItem - WardrobeItem entity
     * @returns {Promise<void>}
     */
    async save(wardrobeItem) {
        try {
            if (!(wardrobeItem instanceof WardrobeItem)) {
                throw new Error('Invalid wardrobe item entity');
            }

            const row = WardrobeItemMapper.toDatabase(wardrobeItem, true);

            const { error } = await this.client
                .from(this.tableName)
                .upsert(row, { onConflict: 'item_id' });

            if (error) {
                console.error('Error saving wardrobe item:', error);
                throw new Error(`Failed to save wardrobe item: ${error.message}`);
            }
        } catch (error) {
            console.error('Error in save:', error);
            throw error;
        }
    }

    async findShootableItems(userId, offset = 0, limit = 20, search = '') {
        try {
            let query = this.client
                .from(this.tableName)
                .select('item_id, title, category, brand, thumbnail_url, high_res_image_url, colour')
                .or(`user_id.eq.${userId},is_stock.eq.true`);

            if (search) {
                query = query.ilike('title', `%${search}%`);
            }

            const { data, error } = await query
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);
            if (error) throw new Error(`Failed to find shootable wardrobe items: ${error.message}`);
            return data || [];
        } catch (error) {
            console.error('WardrobeRepository.findShootableItems:', error);
            throw error;
        }
    }

    /**
     * Delete a wardrobe item
     * @param {string} id - Wardrobe item ID (item_id)
     * @returns {Promise<void>}
     */
    async delete(id) {
        try {
            const { error } = await this.client
                .from(this.tableName)
                .delete()
                .eq('item_id', id);

            if (error) {
                console.error('Error deleting wardrobe item:', error);
                throw new Error(`Failed to delete wardrobe item: ${error.message}`);
            }
        } catch (error) {
            console.error('Error in delete:', error);
            throw error;
        }
    }
}
