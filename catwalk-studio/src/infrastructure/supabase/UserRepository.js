import { IUserRepository } from '../../interfaces/repositories/IUserRepository.js';
import { UserMapper } from './mappers/UserMapper.js';
import { User } from '../../domain/entities/User.js';
import { getSupabaseClient } from './supabase.client.js';

/**
 * Supabase User Repository
 * Implements IUserRepository using Supabase as the data source
 */
export class UserRepository extends IUserRepository {
    constructor() {
        super();
        this.tableName = 'users';
    }

    /**
     * Get Supabase client
     * @returns {import('@supabase/supabase-js').SupabaseClient}
     */
    get client() {
        return getSupabaseClient();
    }

    /**
     * Find a user by ID
     * @param {string} id - User ID
     * @returns {Promise<User|null>}
     */
    async findById(id) {
        try {
            const { data, error } = await this.client
                .from(this.tableName)
                .select('*')
                .eq('user_id', id)
                .single();

            if (error) {
                // PGRST116 is "not found" error - not an actual error
                if (error.code === 'PGRST116') {
                    return null;
                }
                console.error('Error finding user by ID:', error);
                throw new Error(`Failed to find user: ${error.message}`);
            }

            return UserMapper.toDomain(data);
        } catch (error) {
            console.error('Error in findById:', error);
            throw error;
        }
    }

    /**
     * Save or update a user
     * @param {User} user - User entity to save
     * @returns {Promise<void>}
     */
    async save(user) {
        try {
            if (!(user instanceof User)) {
                throw new Error('Invalid user entity');
            }

            const row = UserMapper.toDatabase(user);

            const { error } = await this.client
                .from(this.tableName)
                .upsert(row, { onConflict: 'user_id' });

            if (error) {
                console.error('Error saving user:', error);
                throw new Error(`Failed to save user: ${error.message}`);
            }
        } catch (error) {
            console.error('Error in save:', error);
            throw error;
        }
    }

    /**
     * Create a new user
     * @param {Object} userData - User data
     * @returns {Promise<User>}
     */
    async create(userData) {
        try {
            // Create User entity first (validates data)
            const user = User.create(userData);

            // Convert to database format
            const row = UserMapper.toDatabase(user);

            // Insert into database
            const { data, error } = await this.client
                .from(this.tableName)
                .insert(row)
                .select()
                .single();

            if (error) {
                console.error('Error creating user:', error);
                throw new Error(`Failed to create user: ${error.message}`);
            }

            // Return domain entity
            return UserMapper.toDomain(data);
        } catch (error) {
            console.error('Error in create:', error);
            throw error;
        }
    }

    /**
     * Update specific fields on a user profile
     * @param {string} userId - User ID
     * @param {Object} updates - Partial fields to update (e.g., { user_type: 'model' })
     * @returns {Promise<void>}
     */
    async updateProfile(userId, updates) {
        try {
            const { error } = await this.client
                .from(this.tableName)
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('user_id', userId);

            if (error) {
                console.error('Error updating user profile:', error);
                throw new Error(`Failed to update user profile: ${error.message}`);
            }
        } catch (error) {
            console.error('Error in updateProfile:', error);
            throw error;
        }
    }

    /**
     * Find user by email
     * @param {string} email - User email
     * @returns {Promise<User|null>}
     */
    async findByEmail(email) {
        try {
            const { data, error } = await this.client
                .from(this.tableName)
                .select('*')
                .eq('email', email)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                console.error('Error finding user by email:', error);
                throw new Error(`Failed to find user: ${error.message}`);
            }

            return UserMapper.toDomain(data);
        } catch (error) {
            console.error('Error in findByEmail:', error);
            throw error;
        }
    }
}
