import { User } from '../../../domain/entities/User.js';

/**
 * User Mapper
 * Maps between database rows (public.users table) and User entities
 */
export class UserMapper {
    /**
     * Convert database row to User entity
     * @param {Object} row - Database row from users table
     * @returns {User} User entity
     */
    static toDomain(row) {
        if (!row) return null;

        const props = {
            email: row.email,
            displayName: row.username || row.email || 'Guest User',
            avatarUrl: null,
            creditBalance: row.credits_balance || 0,
            subscriptionTier: 'free',
            isModel: false,
            isElite: false,
            isGuest: row.is_guest || false,
            createdAt: row.created_at ? new Date(row.created_at) : new Date(),
            updatedAt: row.updated_at ? new Date(row.updated_at) : new Date()
        };

        return User.create(props, row.user_id);
    }

    /**
     * Convert User entity to database row
     * @param {User} user - User entity
     * @returns {Object} Database row for users table
     */
    static toDatabase(user) {
        return {
            user_id: user.id,
            email: user.email,
            username: user.displayName,
            credits_balance: user.creditBalance,
            is_guest: user.isGuest,
            updated_at: new Date().toISOString()
        };
    }

    /**
     * Convert database row to DTO (for direct DTO mapping if needed)
     * @param {Object} row - Database row
     * @returns {Object} DTO-compatible object
     */
    static toDTO(row) {
        if (!row) return null;

        return {
            id: row.user_id,
            email: row.email,
            displayName: row.username || row.email || 'Guest User',
            creditBalance: row.credits_balance || 0,
            userType: row.user_type,
            status: row.status,
            isGuest: row.is_guest || false,
            createdAt: row.created_at ? new Date(row.created_at) : new Date(),
            updatedAt: row.updated_at ? new Date(row.updated_at) : new Date()
        };
    }
}
