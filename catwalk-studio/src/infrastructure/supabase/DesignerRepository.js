import { IDesignerRepository } from '../../interfaces/repositories/IDesignerRepository.js';
import { DesignerMapper } from './mappers/DesignerMapper.js';
import { Collection } from '../../domain/entities/Collection.js';
import { DesignerItem } from '../../domain/entities/DesignerItem.js';
import { getSupabaseClient } from './supabase.client.js';

/**
 * Supabase Designer Repository
 * Implements IDesignerRepository using Supabase as the data source
 */
export class DesignerRepository extends IDesignerRepository {
    constructor() {
        super();
        this.collectionsTable = 'designer_collections';
        this.itemsTable = 'designer_items';
    }

    /**
     * Get Supabase client
     * @returns {import('@supabase/supabase-js').SupabaseClient}
     */
    get client() {
        return getSupabaseClient();
    }

    // ========================================================
    // Collection Methods
    // ========================================================

    async findCollectionById(id) {
        try {
            const { data, error } = await this.client
                .from(this.collectionsTable)
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null;
                throw new Error(`Failed to find collection: ${error.message}`);
            }

            return DesignerMapper.collectionToDomain(data);
        } catch (error) {
            console.error('Error in findCollectionById:', error);
            throw error;
        }
    }

    async findCollectionsByUserId(userId) {
        try {
            const { data, error } = await this.client
                .from(this.collectionsTable)
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                throw new Error(`Failed to find collections: ${error.message}`);
            }

            return (data || []).map(row => DesignerMapper.collectionToDomain(row));
        } catch (error) {
            console.error('Error in findCollectionsByUserId:', error);
            throw error;
        }
    }

    async createCollection(collection) {
        try {
            if (!(collection instanceof Collection)) {
                throw new Error('Invalid collection entity');
            }

            const row = DesignerMapper.collectionToDatabase(collection);
            row.created_at = new Date().toISOString();

            const { data, error } = await this.client
                .from(this.collectionsTable)
                .insert(row)
                .select()
                .single();

            if (error) {
                throw new Error(`Failed to create collection: ${error.message}`);
            }

            return DesignerMapper.collectionToDomain(data);
        } catch (error) {
            console.error('Error in createCollection:', error);
            throw error;
        }
    }

    async saveCollection(collection) {
        try {
            if (!(collection instanceof Collection)) {
                throw new Error('Invalid collection entity');
            }

            const row = DesignerMapper.collectionToDatabase(collection);

            const { error } = await this.client
                .from(this.collectionsTable)
                .upsert(row, { onConflict: 'id' });

            if (error) {
                throw new Error(`Failed to save collection: ${error.message}`);
            }
        } catch (error) {
            console.error('Error in saveCollection:', error);
            throw error;
        }
    }

    async deleteCollection(id) {
        try {
            const { error } = await this.client
                .from(this.collectionsTable)
                .delete()
                .eq('id', id);

            if (error) {
                throw new Error(`Failed to delete collection: ${error.message}`);
            }
        } catch (error) {
            console.error('Error in deleteCollection:', error);
            throw error;
        }
    }

    // ========================================================
    // Item Methods
    // ========================================================

    async findItemById(id) {
        try {
            const { data, error } = await this.client
                .from(this.itemsTable)
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null;
                throw new Error(`Failed to find item: ${error.message}`);
            }

            return DesignerMapper.itemToDomain(data);
        } catch (error) {
            console.error('Error in findItemById:', error);
            throw error;
        }
    }

    async findItemsByUserId(userId, options = {}) {
        try {
            const { category } = options;

            let query = this.client
                .from(this.itemsTable)
                .select('*')
                .eq('user_id', userId);

            // Filter by category if provided
            if (category) {
                query = query.eq('category', category);
            }

            query = query.order('created_at', { ascending: false });

            const { data, error } = await query;

            if (error) {
                throw new Error(`Failed to find items: ${error.message}`);
            }

            return (data || []).map(row => DesignerMapper.itemToDomain(row));
        } catch (error) {
            console.error('Error in findItemsByUserId:', error);
            throw error;
        }
    }

    async createItem(item) {
        try {
            if (!(item instanceof DesignerItem)) {
                throw new Error('Invalid item entity');
            }

            const row = DesignerMapper.itemToDatabase(item);
            row.created_at = new Date().toISOString();

            const { data, error } = await this.client
                .from(this.itemsTable)
                .insert(row)
                .select()
                .single();

            if (error) {
                throw new Error(`Failed to create item: ${error.message}`);
            }

            return DesignerMapper.itemToDomain(data);
        } catch (error) {
            console.error('Error in createItem:', error);
            throw error;
        }
    }

    async saveItem(item) {
        try {
            if (!(item instanceof DesignerItem)) {
                throw new Error('Invalid item entity');
            }

            const row = DesignerMapper.itemToDatabase(item);

            const { error } = await this.client
                .from(this.itemsTable)
                .upsert(row, { onConflict: 'id' });

            if (error) {
                throw new Error(`Failed to save item: ${error.message}`);
            }
        } catch (error) {
            console.error('Error in saveItem:', error);
            throw error;
        }
    }

    async deleteItem(id) {
        try {
            const { error } = await this.client
                .from(this.itemsTable)
                .delete()
                .eq('id', id);

            if (error) {
                throw new Error(`Failed to delete item: ${error.message}`);
            }
        } catch (error) {
            console.error('Error in deleteItem:', error);
            throw error;
        }
    }
}
