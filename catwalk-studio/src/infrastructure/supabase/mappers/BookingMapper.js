import { Booking } from '../../../domain/entities/Booking.js';

export class BookingMapper {
    static toDomain(row) {
        if (!row) return null;

        const props = {
            modelId: row.model_id,
            brandId: row.brand_id,
            bookingDate: row.booking_date,
            bookingType: row.booking_type || 'full_day',
            location: row.location,
            details: row.details,
            amount: row.amount,
            currency: row.currency,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
        
        // Handle joined model data if present
        if (row.models) {
            props.model = {
                id: row.models.id,
                username: row.models.username || row.models.display_name,
                profileImageUrl: row.models.profile_image_url,
            };
        }

        // Handle joined brand data if present
        if (row.users) {
            props.brand = {
                id: row.users.id,
                email: row.users.email,
                displayName: row.users.display_name,
            };
        }

        return Booking.create(props, row.id);
    }

    static toDatabase(booking) {
        return {
            id: booking.id,
            model_id: booking.modelId,
            brand_id: booking.brandId,
            booking_date: booking.bookingDate.toISOString(),
            booking_type: booking.bookingType,
            location: booking.location,
            details: booking.details,
            amount: booking.amount,
            currency: booking.currency,
            status: booking.status,
            updated_at: new Date().toISOString(),
        };
    }

    static toDTO(booking) {
        if (!booking) return null;
        
        return {
            id: booking.id,
            modelId: booking.modelId,
            brandId: booking.brandId,
            bookingDate: booking.bookingDate,
            bookingType: booking.bookingType,
            location: booking.location,
            details: booking.details,
            amount: booking.amount,
            currency: booking.currency,
            status: booking.status,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt,
            model: booking.model,
            brand: booking.brand,
        };
    }
}
