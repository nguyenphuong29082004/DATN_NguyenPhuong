import { Entity } from './Entity.js';

/**
 * Campaign Domain Entity
 * Represents a campaign folder for organizing shoots/generations
 * 
 * Business Rules:
 * - Campaigns belong to a user
 * - Campaigns organize multiple generations (shoots)
 * - Campaigns have a status: active, archived
 * - Campaigns track total generations and costs
 */
export class Campaign extends Entity {
    /**
     * Create a Campaign entity
     * @param {Object} props - Campaign properties
     * @param {string} props.userId - Owner user ID
     * @param {string} props.name - Campaign name
     * @param {string} [props.details] - Campaign description/details
     * @param {string} [props.brandGuidelinesUrl] - URL to brand guidelines document/image
     * @param {string} [props.status] - Campaign status (active/archived)
     * @param {Object} [props.metadata] - Additional metadata (JSONB)
     * @param {number} [props.totalCost] - Total credit cost
     * @param {Array<string>} [props.generationIds] - Array of generation IDs
     * @param {Date} [props.createdAt] - Creation timestamp
     * @param {Date} [props.updatedAt] - Last update timestamp
     * @param {string} [id] - Campaign ID
     */
    constructor(props, id) {
        super(props, id);
        this.validate();
    }

    /**
     * Factory method to create a Campaign
     * @param {Object} props - Campaign properties
     * @param {string} [id] - Optional ID
     * @returns {Campaign}
     */
    static create(props, id) {
        const defaultProps = {
            details: null,
            brandGuidelinesUrl: null,
            status: 'active',
            metadata: {},
            totalCost: 0,
            generationIds: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            ...props
        };

        return new Campaign(defaultProps, id);
    }

    /**
     * Validate campaign properties
     * @throws {Error} If validation fails
     */
    validate() {
        if (!this.props.userId) {
            throw new Error('User ID is required');
        }

        if (!this.props.name || this.props.name.trim() === '') {
            throw new Error('Campaign name is required');
        }

        const validStatuses = ['active', 'archived'];
        if (!validStatuses.includes(this.props.status)) {
            throw new Error('Invalid status. Must be active or archived');
        }
    }

    // ========================================================
    // Getters
    // ========================================================

    get userId() {
        return this.props.userId;
    }

    get name() {
        return this.props.name;
    }

    get details() {
        return this.props.details;
    }

    get brandGuidelinesUrl() {
        return this.props.brandGuidelinesUrl;
    }

    get status() {
        return this.props.status;
    }

    get metadata() {
        return this.props.metadata;
    }

    get totalCost() {
        return this.props.totalCost;
    }

    get generationIds() {
        return this.props.generationIds;
    }

    get generationCount() {
        return this.props.generationIds.length;
    }

    get createdAt() {
        return this.props.createdAt;
    }

    get updatedAt() {
        return this.props.updatedAt;
    }

    // ========================================================
    // Business Logic Methods
    // ========================================================

    /**
     * Archive the campaign
     * @throws {Error} If campaign is not active
     */
    archive() {
        if (this.props.status !== 'active') {
            throw new Error('Can only archive active campaigns');
        }

        this.props.status = 'archived';
        this.props.updatedAt = new Date();
    }

    /**
     * Reactivate an archived campaign
     * @throws {Error} If campaign is not archived
     */
    reactivate() {
        if (this.props.status !== 'archived') {
            throw new Error('Can only reactivate archived campaigns');
        }

        this.props.status = 'active';
        this.props.updatedAt = new Date();
    }

    /**
     * Add a generation to the campaign
     * @param {string} generationId - Generation ID
     * @param {number} cost - Generation cost in credits
     */
    addGeneration(generationId, cost = 0) {
        if (!this.props.generationIds.includes(generationId)) {
            this.props.generationIds.push(generationId);
            this.props.totalCost += cost;
            this.props.updatedAt = new Date();
        }
    }

    /**
     * Check if campaign is owned by a specific user
     * @param {string} userId - User ID to check
     * @returns {boolean}
     */
    isOwnedBy(userId) {
        return this.props.userId === userId;
    }

    /**
     * Check if campaign is active
     * @returns {boolean}
     */
    isActive() {
        return this.props.status === 'active';
    }

    /**
     * Check if campaign is archived
     * @returns {boolean}
     */
    isArchived() {
        return this.props.status === 'archived';
    }

    /**
     * Update campaign details
     * @param {Object} updates - Properties to update
     */
    updateDetails(updates) {
        const allowedUpdates = ['name', 'details', 'brandGuidelinesUrl', 'metadata'];

        Object.keys(updates).forEach(key => {
            if (allowedUpdates.includes(key)) {
                this.props[key] = updates[key];
            }
        });

        this.props.updatedAt = new Date();
        this.validate();
    }

    /**
     * Convert campaign to plain object
     * @returns {Object}
     */
    toObject() {
        return {
            id: this.id,
            userId: this.userId,
            name: this.name,
            details: this.details,
            brandGuidelinesUrl: this.brandGuidelinesUrl,
            status: this.status,
            metadata: this.metadata,
            totalCost: this.totalCost,
            generationIds: this.generationIds,
            generationCount: this.generationCount,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
