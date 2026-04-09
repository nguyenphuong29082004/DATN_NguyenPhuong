import { Result } from '../UseCase.js';

/**
 * Use case to get bookings made by a user (as a brand/customer)
 */
export class GetBrandBookingsUseCase {
    constructor(bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    /**
     * Executes the use case
     * @param {string} userId - The ID of the user who made the bookings
     * @returns {Promise<Result>} - Result containing array of bookings
     */
    async execute(userId) {
        try {
            if (!userId) {
                return Result.fail('User ID is required');
            }

            const bookings = await this.bookingRepository.findByBrand(userId);
            return Result.ok(bookings);
        } catch (error) {
            console.error('GetBrandBookingsUseCase.execute:', error);
            return Result.fail(error.message);
        }
    }
}
