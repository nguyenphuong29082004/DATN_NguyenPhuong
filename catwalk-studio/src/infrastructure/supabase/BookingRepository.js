import { IBookingRepository } from '../../interfaces/repositories/IBookingRepository.js';
import { getSupabaseClient } from './supabase.client.js';

export class BookingRepository extends IBookingRepository {
    constructor() {
        super();
        this.tableName = 'model_bookings';
    }

    get client() {
        return getSupabaseClient();
    }

    async create(booking) {
        try {
            // Ensure the booking user (brand) exists in the users table to avoid FK violation
            if (booking.brand_id) {
                const { data: { user } } = await this.client.auth.getUser();
                if (user && user.id === booking.brand_id) {
                    const { error: upsertError } = await this.client
                        .from('users')
                        .upsert({
                            user_id: user.id,
                            email: user.email || null, // Use null if no email to avoid unique constraint issues with empty strings
                            user_type: 'brand',
                        }, { onConflict: 'user_id' });
                    
                    if (upsertError) {
                        console.error('BookingRepository: Failed to upsert user profile:', upsertError);
                    }
                }
            }

            const { data, error } = await this.client
                .from(this.tableName)
                .insert(booking)
                .select()
                .single();

            if (error) {
                console.error('BookingRepository: Insert failed:', error);
                console.error('Attempted booking data:', booking);
                throw new Error(`Failed to create booking: ${error.message}`);
            }

            return data;
        } catch (error) {
            console.error('BookingRepository.create:', error);
            throw error;
        }
    }

    async findByModelOwner(userId) {
        try {
            const { data, error } = await this.client
                .from(this.tableName)
                .select(`
                    *,
                    models:model_id (id, username, display_name, profile_image_url, created_by_user_id),
                    users:brand_id (id, email, display_name)
                `)
                .eq('models.created_by_user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw new Error(`Failed to fetch bookings: ${error.message}`);
            
            // Supabase returns rows where relation matches. If a model doesn't match the eq, it returns null for `models` but still returns the booking row.
            // So we need to filter out rows where models is null (due to inner join behavior in PostgREST vs embedded filtering)
            const validData = data.filter(r => r.models !== null);
            
            const { BookingMapper } = await import('./mappers/BookingMapper.js');
            return validData.map(row => BookingMapper.toDomain(row));
        } catch (error) {
            console.error('BookingRepository.findByModelOwner:', error);
            throw error;
        }
    }

    async updateStatus(bookingId, status) {
        try {
            const { data, error } = await this.client
                .from(this.tableName)
                .update({ status, updated_at: new Date().toISOString() })
                .eq('id', bookingId)
                .select(`
                    *,
                    models:model_id (id, username, display_name, profile_image_url),
                    users:brand_id (id, email, display_name)
                `)
                .single();

            if (error) throw new Error(`Failed to update booking status: ${error.message}`);

            const { BookingMapper } = await import('./mappers/BookingMapper.js');
            return BookingMapper.toDomain(data);
        } catch (error) {
            console.error('BookingRepository.updateStatus:', error);
            throw error;
        }
    }

    async findByBrand(userId) {
        try {
            const { data, error } = await this.client
                .from(this.tableName)
                .select(`
                    *,
                    models:model_id (id, username, display_name, profile_image_url),
                    users:brand_id (id, email, display_name)
                `)
                .eq('brand_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw new Error(`Failed to fetch your bookings: ${error.message}`);
            
            const { BookingMapper } = await import('./mappers/BookingMapper.js');
            return data.map(row => BookingMapper.toDomain(row));
        } catch (error) {
            console.error('BookingRepository.findByBrand:', error);
            throw error;
        }
    }
}
