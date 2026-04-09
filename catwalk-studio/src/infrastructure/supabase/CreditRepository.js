import { ICreditRepository } from '../../interfaces/repositories/ICreditRepository.js';
import { CreditTransactionMapper } from './mappers/CreditTransactionMapper.js';
import { CreditTransaction } from '../../domain/entities/CreditTransaction.js';
import { getSupabaseClient } from './supabase.client.js';

/**
 * Supabase Credit Repository
 * Implements ICreditRepository using Supabase as the data source
 */
export class CreditRepository extends ICreditRepository {
    constructor() {
        super();
        this.tableName = 'credit_transactions';
    }

    /**
     * Get Supabase client
     * @returns {import('@supabase/supabase-js').SupabaseClient}
     */
    get client() {
        return getSupabaseClient();
    }

    /**
     * Log a credit transaction
     * @param {CreditTransaction} transaction - Transaction entity to log
     * @returns {Promise<void>}
     */
    async logTransaction(transaction) {
        try {
            if (!(transaction instanceof CreditTransaction)) {
                throw new Error('Invalid transaction entity');
            }

            const row = CreditTransactionMapper.toDatabase(transaction);

            const { error } = await this.client
                .from(this.tableName)
                .insert(row);

            if (error) {
                console.error('Error logging transaction:', error);
                throw new Error(`Failed to log transaction: ${error.message}`);
            }
        } catch (error) {
            console.error('Error in logTransaction:', error);
            throw error;
        }
    }

    /**
     * Get credit transaction history for a user
     * @param {string} userId - User ID
     * @param {number} [limit=50] - Maximum number of transactions to return
     * @returns {Promise<CreditTransaction[]>}
     */
    async getHistory(userId, limit = 50) {
        try {
            const { data, error } = await this.client
                .from(this.tableName)
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('Error getting transaction history:', error);
                throw new Error(`Failed to get transaction history: ${error.message}`);
            }

            // Map rows to entities
            return (data || []).map(row => CreditTransactionMapper.toDomain(row));
        } catch (error) {
            console.error('Error in getHistory:', error);
            throw error;
        }
    }

    /**
     * Get current credit balance for a user
     * Note: This is a convenience method. In Clean Architecture,
     * credit balance should come from User entity via UserRepository.
     * @param {string} userId - User ID
     * @returns {Promise<number>}
     */
    async getBalance(userId) {
        try {
            const { data, error } = await this.client
                .from('users')
                .select('credits_balance')
                .eq('user_id', userId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return 0; // User not found
                }
                console.error('Error getting credit balance:', error);
                throw new Error(`Failed to get credit balance: ${error.message}`);
            }

            return data?.credits_balance || 0;
        } catch (error) {
            console.error('Error in getBalance:', error);
            throw error;
        }
    }

    /**
     * Get total credits spent by user
     * @param {string} userId - User ID
     * @returns {Promise<number>}
     */
    async getTotalSpent(userId) {
        try {
            const { data, error } = await this.client
                .from(this.tableName)
                .select('amount')
                .eq('user_id', userId)
                .lt('amount', 0); // Negative amounts are deductions

            if (error) {
                console.error('Error getting total spent:', error);
                throw new Error(`Failed to get total spent: ${error.message}`);
            }

            // Sum all negative amounts (take absolute value)
            const total = (data || []).reduce((sum, row) => sum + Math.abs(row.amount), 0);
            return total;
        } catch (error) {
            console.error('Error in getTotalSpent:', error);
            throw error;
        }
    }

    /**
     * Get total credits earned by user
     * @param {string} userId - User ID
     * @returns {Promise<number>}
     */
    async getTotalEarned(userId) {
        try {
            const { data, error } = await this.client
                .from(this.tableName)
                .select('amount')
                .eq('user_id', userId)
                .gt('amount', 0); // Positive amounts are additions

            if (error) {
                console.error('Error getting total earned:', error);
                throw new Error(`Failed to get total earned: ${error.message}`);
            }

            const total = (data || []).reduce((sum, row) => sum + row.amount, 0);
            return total;
        } catch (error) {
            console.error('Error in getTotalEarned:', error);
            throw error;
        }
    }
}
