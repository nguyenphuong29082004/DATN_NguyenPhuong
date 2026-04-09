/* eslint-disable no-unused-vars */
/**
 * Booking Repository Interface
 */
export class IBookingRepository {
    async create(_booking) { throw new Error('Not implemented'); }
    async findByModelOwner(_userId) { throw new Error('Not implemented'); }
    async updateStatus(_bookingId, _status) { throw new Error('Not implemented'); }
}
