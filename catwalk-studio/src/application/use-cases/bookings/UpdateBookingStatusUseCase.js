import { UseCase, Result } from '../UseCase.js';

export class UpdateBookingStatusUseCase extends UseCase {
    constructor(bookingRepository) {
        super();
        this.bookingRepository = bookingRepository;
    }

    async execute({ bookingId, status }) {
        try {
            if (!bookingId) return Result.fail('Booking ID is required');
            if (!status) return Result.fail('Status is required');

            const validStatuses = ['pending', 'accepted', 'rejected', 'completed', 'cancelled'];
            if (!validStatuses.includes(status)) {
                return Result.fail(`Invalid status: ${status}`);
            }

            const updatedBooking = await this.bookingRepository.updateStatus(bookingId, status);
            return Result.ok(updatedBooking);
        } catch (error) {
            return Result.fail(error.message || 'Failed to update booking status');
        }
    }
}
