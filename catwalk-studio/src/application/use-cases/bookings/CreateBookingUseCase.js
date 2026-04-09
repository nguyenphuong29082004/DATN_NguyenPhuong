import { UseCase, Result } from '../UseCase.js';

export class CreateBookingUseCase extends UseCase {
    constructor(bookingRepository) {
        super();
        this.bookingRepository = bookingRepository;
    }

    async execute(input) {
        try {
            const { modelId, userId, date, bookingType, location, details } = input;

            if (!modelId) return Result.fail('Model ID is required');
            if (!userId) return Result.fail('User ID is required');
            if (!date) return Result.fail('Booking date is required');
            if (!bookingType) return Result.fail('Booking type is required');
            if (!['half_day', 'full_day'].includes(bookingType)) {
                return Result.fail('Invalid booking type');
            }

            const booking_date = `${date}T00:00:00.000Z`;

            const booking = await this.bookingRepository.create({
                model_id: modelId,
                brand_id: userId,
                booking_date,
                booking_type: bookingType,
                location,
                details,
                status: 'pending',
            });

            return Result.ok(booking);
        } catch (error) {
            return Result.fail(error.message || 'Failed to create booking');
        }
    }
}
