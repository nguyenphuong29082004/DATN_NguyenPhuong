import { UseCase, Result } from '../UseCase.js';

export class GetModelBookingsUseCase extends UseCase {
    constructor(bookingRepository) {
        super();
        this.bookingRepository = bookingRepository;
    }

    async execute(userId) {
        try {
            if (!userId) return Result.fail('User ID is required');

            const bookings = await this.bookingRepository.findByModelOwner(userId);
            return Result.ok(bookings);
        } catch (error) {
            return Result.fail(error.message || 'Failed to fetch bookings');
        }
    }
}
