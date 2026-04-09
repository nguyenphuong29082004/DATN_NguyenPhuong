import { Entity } from './Entity.js';

/**
 * Generation Domain Entity
 * Represents an AI-generated image in the system
 * 
 * Business Rules:
 * - Generations belong to a user
 * - Generations can be published to public gallery
 * - Published generations can be liked by other users
 * - Generations have a status: pending, completed, failed
 * - Deleted generations should be soft-deleted (marked as deleted)
 */
export class Generation extends Entity {
    /**
     * Create a Generation entity
     * @param {Object} props - Generation properties
     * @param {string} props.userId - Owner user ID
     * @param {string} [props.modelId] - AI Model ID used for generation
     * @param {string} props.prompt - Generation prompt
     * @param {string} [props.imageUrl] - Generated image URL
     * @param {string} props.status - Generation status ('pending', 'completed', 'failed')
     * @param {boolean} [props.isPublished] - Whether published to gallery
     * @param {number} [props.likes] - Number of likes (for published)
     * @param {string} [props.quality] - Quality setting ('standard', 'hd')
     * @param {Object} [props.settings] - Generation settings (size, style, etc.)
     * @param {string} [props.errorMessage] - Error message if failed
     * @param {string} [props.outputType] - Output media type ('photo', 'video', etc.)
     * @param {number} [props.creditsUsed] - Credits consumed
     * @param {string} [props.aiModelId] - AI model ID (from ai_models table)
     * @param {string} [props.type] - Generation type ('quick_shoot', 'ai_model')
     * @param {string} [props.generationType] - Type for tracking ('photo', 'video', 'try-on')
     * @param {number} [props.durationMs] - Generation duration in milliseconds
     * @param {number} [props.apiCost] - Backend API cost in fraction of cents
     * @param {Date} [props.createdAt] - Creation timestamp
     * @param {Date} [props.updatedAt] - Last update timestamp
     * @param {Date} [props.publishedAt] - Published timestamp
     * @param {string} [id] - Generation ID
     */
    constructor(props, id) {
        super(props, id);
        this.validate();
    }

    /**
     * Factory method to create a Generation
     * @param {Object} props - Generation properties
     * @param {string} [id] - Optional ID
     * @returns {Generation}
     */
    static create(props, id) {
        const defaultProps = {
            modelId: null,
            imageUrl: null,
            status: 'pending',
            isPublished: false,
            likes: 0,
            quality: 'standard',
            settings: {},
            errorMessage: null,
            outputType: null,
            creditsUsed: 0,
            aiModelId: null,
            type: null,
            generationType: 'photo',
            durationMs: null,
            apiCost: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            publishedAt: null,
            ...props
        };

        return new Generation(defaultProps, id);
    }

    /**
     * Validate generation properties
     * @throws {Error} If validation fails
     */
    validate() {
        if (!this.props.userId) {
            throw new Error('User ID is required');
        }

        if (!this.props.prompt || this.props.prompt.trim() === '') {
            throw new Error('Prompt is required');
        }

        const validStatuses = ['pending', 'processing', 'completed', 'failed', 'timeout', 'canceled'];
        if (!validStatuses.includes(this.props.status)) {
            throw new Error('Invalid status. Must be pending, processing, completed, failed, timeout, or canceled');
        }

        if (typeof this.props.isPublished !== 'boolean') {
            throw new Error('isPublished must be a boolean');
        }

        if (typeof this.props.likes !== 'number' || this.props.likes < 0) {
            throw new Error('Likes must be a non-negative number');
        }

        const validQualities = ['standard', 'hd'];
        if (!validQualities.includes(this.props.quality)) {
            throw new Error('Quality must be standard or hd');
        }
    }

    // ========================================================
    // Getters
    // ========================================================

    get userId() {
        return this.props.userId;
    }

    get modelId() {
        return this.props.modelId;
    }

    get prompt() {
        return this.props.prompt;
    }

    get imageUrl() {
        return this.props.imageUrl;
    }

    get status() {
        return this.props.status;
    }

    get isPublished() {
        return this.props.isPublished;
    }

    get likes() {
        return this.props.likes;
    }

    get quality() {
        return this.props.quality;
    }

    get settings() {
        return this.props.settings;
    }

    get errorMessage() {
        return this.props.errorMessage;
    }

    get outputType() {
        return this.props.outputType;
    }

    get creditsUsed() {
        return this.props.creditsUsed;
    }

    get aiModelId() {
        return this.props.aiModelId;
    }

    get type() {
        return this.props.type;
    }

    get generationType() {
        return this.props.generationType;
    }

    get durationMs() {
        return this.props.durationMs;
    }

    get apiCost() {
        return this.props.apiCost;
    }

    get createdAt() {
        return this.props.createdAt;
    }

    get updatedAt() {
        return this.props.updatedAt;
    }

    get publishedAt() {
        return this.props.publishedAt;
    }

    // ========================================================
    // Business Logic Methods
    // ========================================================

    /**
     * Mark generation as completed with image URL
     * @param {string} imageUrl - Generated image URL
     */
    markAsCompleted(imageUrl) {
        if (!imageUrl || imageUrl.trim() === '') {
            throw new Error('Image URL is required');
        }

        this.props.status = 'completed';
        this.props.imageUrl = imageUrl;
        this.props.updatedAt = new Date();
    }

    /**
     * Mark generation as failed with error message
     * @param {string} errorMessage - Error message
     */
    markAsFailed(errorMessage) {
        this.props.status = 'failed';
        this.props.errorMessage = errorMessage || 'Generation failed';
        this.props.updatedAt = new Date();
    }

    /**
     * Publish generation to public gallery
     * @throws {Error} If generation is not completed
     */
    publish() {
        if (this.props.status !== 'completed') {
            throw new Error('Cannot publish incomplete generation');
        }

        if (!this.props.imageUrl) {
            throw new Error('Cannot publish generation without image');
        }

        this.props.isPublished = true;
        this.props.publishedAt = new Date();
        this.props.updatedAt = new Date();
    }

    /**
     * Unpublish generation from gallery
     */
    unpublish() {
        this.props.isPublished = false;
        this.props.updatedAt = new Date();
    }

    /**
     * Increment likes (for published generations)
     * @throws {Error} If generation is not published
     */
    incrementLikes() {
        if (!this.props.isPublished) {
            throw new Error('Cannot like unpublished generation');
        }

        this.props.likes += 1;
        this.props.updatedAt = new Date();
    }

    /**
     * Decrement likes
     */
    decrementLikes() {
        if (!this.props.isPublished) {
            throw new Error('Cannot unlike unpublished generation');
        }

        if (this.props.likes > 0) {
            this.props.likes -= 1;
            this.props.updatedAt = new Date();
        }
    }

    /**
     * Check if generation is owned by a specific user
     * @param {string} userId - User ID to check
     * @returns {boolean}
     */
    isOwnedBy(userId) {
        return this.props.userId === userId;
    }

    /**
     * Check if generation can be viewed by a user
     * @param {string} userId - User ID
     * @returns {boolean}
     */
    canBeViewedBy(userId) {
        return this.props.isPublished || this.isOwnedBy(userId);
    }

    /**
     * Check if generation is completed
     * @returns {boolean}
     */
    isCompleted() {
        return this.props.status === 'completed';
    }

    /**
     * Check if generation is pending
     * @returns {boolean}
     */
    isPending() {
        return this.props.status === 'pending';
    }

    /**
     * Check if generation failed
     * @returns {boolean}
     */
    isFailed() {
        return this.props.status === 'failed';
    }

    /**
     * Get credit cost based on quality
     * @returns {number} Credit cost
     */
    getCreditCost() {
        const costs = {
            'standard': 5,
            'hd': 10
        };
        return costs[this.props.quality] || 5;
    }

    /**
     * Convert generation to plain object
     * @returns {Object}
     */
    toObject() {
        return {
            id: this.id,
            userId: this.userId,
            modelId: this.modelId,
            prompt: this.prompt,
            imageUrl: this.imageUrl,
            status: this.status,
            isPublished: this.isPublished,
            likes: this.likes,
            quality: this.quality,
            settings: this.settings,
            errorMessage: this.errorMessage,
            outputType: this.outputType,
            creditsUsed: this.creditsUsed,
            aiModelId: this.aiModelId,
            type: this.type,
            generationType: this.generationType,
            durationMs: this.durationMs,
            apiCost: this.apiCost,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            publishedAt: this.publishedAt,
        };
    }
}
