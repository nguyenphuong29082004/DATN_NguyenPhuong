import { v4 as uuidv4 } from 'uuid';

/**
 * Base Entity class for all domain entities
 * Provides common functionality like ID management and equality checking
 */
export class Entity {
    /**
     * @param {Object} props - Entity properties
     * @param {string} [id] - Unique identifier (auto-generated if not provided)
     */
    constructor(props, id) {
        this._id = id || this.generateId();
        this.props = props;
    }

    /**
     * Get entity ID
     * @returns {string}
     */
    get id() {
        return this._id;
    }

    /**
     * Generate a unique ID
     * @returns {string}
     */
    generateId() {
        return uuidv4();
    }

    /**
     * Check if two entities are equal (based on ID)
     * @param {Entity} entity - Another entity to compare
     * @returns {boolean}
     */
    equals(entity) {
        if (!entity || !(entity instanceof Entity)) {
            return false;
        }
        return this._id === entity._id;
    }

    /**
     * Clone the entity with updated props
     * @param {Object} updatedProps - Properties to update
     * @returns {Entity}
     */
    clone(updatedProps = {}) {
        return new this.constructor({ ...this.props, ...updatedProps }, this._id);
    }

    /**
     * Convert entity to plain object
     * @returns {Object}
     */
    toObject() {
        return {
            id: this._id,
            ...this.props
        };
    }
}
