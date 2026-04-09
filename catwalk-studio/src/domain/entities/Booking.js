import { Entity } from './Entity.js';

/**
 * Booking Domain Entity
 * Represents a booking request between a Brand (User) and a Model
 * Maps to the `model_bookings` table
 */
export class Booking extends Entity {
    /**
     * @param {Object} props
     * @param {string} props.modelId
     * @param {string} props.brandId
     * @param {Date} props.bookingDate
     * @param {'half_day'|'full_day'} [props.bookingType]
     * @param {string} [props.location]
     * @param {string} [props.details]
     * @param {number} [props.amount]
     * @param {string} [props.currency]
     * @param {string} [props.status] - 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled'
     * @param {Date} [props.createdAt]
     * @param {Date} [props.updatedAt]
     * @param {Object} [props.model] - Optional joined model data
     * @param {Object} [props.brand] - Optional joined user/brand data
     * @param {string} [id]
     */
    constructor(props, id) {
        super(props, id);
        
        this._modelId = props.modelId;
        this._brandId = props.brandId;
        this._bookingDate = props.bookingDate ? new Date(props.bookingDate) : null;
        this._bookingType = props.bookingType || 'full_day';
        this._location = props.location || null;
        this._details = props.details || null;
        this._amount = props.amount || 0;
        this._currency = props.currency || 'USD';
        this._status = props.status || 'pending';
        this._createdAt = props.createdAt ? new Date(props.createdAt) : new Date();
        this._updatedAt = props.updatedAt ? new Date(props.updatedAt) : new Date();
        
        // Joined relations (optional)
        this._model = props.model || null;
        this._brand = props.brand || null;
    }

    static create(props, id) {
        const booking = new Booking(props, id);
        booking.validate();
        return booking;
    }

    validate() {
        if (!this._modelId) throw new Error('Model ID is required');
        if (!this._brandId) throw new Error('Brand ID is required');
        if (!this._bookingDate) throw new Error('Booking Date is required');

        const validStatuses = ['pending', 'accepted', 'rejected', 'completed', 'cancelled'];
        if (!validStatuses.includes(this._status)) {
            throw new Error(`Invalid status: ${this._status}`);
        }
    }

    // --- Getters ---
    get modelId() { return this._modelId; }
    get brandId() { return this._brandId; }
    get bookingDate() { return this._bookingDate; }
    get bookingType() { return this._bookingType; }
    get location() { return this._location; }
    get details() { return this._details; }
    get amount() { return this._amount; }
    get currency() { return this._currency; }
    get status() { return this._status; }
    get createdAt() { return this._createdAt; }
    get updatedAt() { return this._updatedAt; }
    get model() { return this._model; }
    get brand() { return this._brand; }

    // --- Actions ---
    accept() {
        if (this._status !== 'pending') throw new Error('Only pending bookings can be accepted');
        this._status = 'accepted';
        this._updatedAt = new Date();
    }

    reject() {
        if (this._status !== 'pending') throw new Error('Only pending bookings can be rejected');
        this._status = 'rejected';
        this._updatedAt = new Date();
    }
    
    complete() {
        if (this._status !== 'accepted') throw new Error('Only accepted bookings can be completed');
        this._status = 'completed';
        this._updatedAt = new Date();
    }
    
    cancel() {
        if (this._status === 'completed' || this._status === 'rejected') {
            throw new Error('Completed or rejected bookings cannot be cancelled');
        }
        this._status = 'cancelled';
        this._updatedAt = new Date();
    }

    toObject() {
        return {
            id: this.id,
            modelId: this._modelId,
            brandId: this._brandId,
            bookingDate: this._bookingDate,
            bookingType: this._bookingType,
            location: this._location,
            details: this._details,
            amount: this._amount,
            currency: this._currency,
            status: this._status,
            createdAt: this._createdAt,
            updatedAt: this._updatedAt,
            model: this._model,
            brand: this._brand,
        };
    }
}
