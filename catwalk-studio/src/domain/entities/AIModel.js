import { Entity } from './Entity.js';

/**
 * AIModel Domain Entity
 * Represents a user-created AI model in the system
 * 
 * Business Rules:
 * - Model name must be unique per user
 * - Models can be public (marketplace) or private (personal use)
 * - Public models are visible to all users
 * - Private models are only visible to the owner
 */
export class AIModel extends Entity {
    /**
     * Create an AIModel entity
     * @param {Object} props - Model properties
     * @param {string} props.userId - Owner user ID
     * @param {string} props.name - Model name
     * @param {string} [props.description] - Model description
     * @param {string} [props.thumbnailUrl] - Thumbnail image URL
     * @param {string} [props.gender] - Model gender ('male', 'female', 'unisex')
     * @param {string} [props.ethnicity] - Model ethnicity
     * @param {string} [props.ageRange] - Age range (e.g., '20-30')
     * @param {boolean} [props.isPublic] - Whether model is public
     * @param {number} [props.usageCount] - Number of times used
     * @param {number} [props.likes] - Number of likes (for public models)
     * @param {Array<string>} [props.tags] - Model tags
     * @param {Object} [props.metadata] - Additional metadata
     * @param {string} [props.generationStatus] - 'idle'|'processing'|'completed'|'failed'
     * @param {string} [props.replicateJobId] - Replicate prediction ID
     * @param {Date} [props.generationStartedAt] - When generation started
     * @param {string} [props.generationError] - Error message if generation failed
     * @param {string} [props.prompt] - Generation prompt used
     * @param {Object} [props.parametersJson] - Generation parameters
     * @param {Date} [props.createdAt] - Creation timestamp
     * @param {Date} [props.updatedAt] - Last update timestamp
     * @param {string} [id] - Model ID
     */
    constructor(props, id) {
        super(props, id);
        this.validate();
    }

    /**
     * Factory method to create an AIModel
     * @param {Object} props - Model properties
     * @param {string} [id] - Optional ID
     * @returns {AIModel}
     */
    static create(props, id) {
        const defaultProps = {
            description: '',
            thumbnailUrl: null,
            gender: 'unisex',
            ethnicity: null,
            ageRange: null,
            isPublic: false,
            usageCount: 0,
            likes: 0,
            tags: [],
            metadata: {},
            generationStatus: 'idle',
            replicateJobId: null,
            generationStartedAt: null,
            generationError: null,
            prompt: null,
            parametersJson: {},
            createdAt: new Date(),
            updatedAt: new Date(),
            ...props
        };

        return new AIModel(defaultProps, id);
    }

    /**
     * Validate model properties
     * @throws {Error} If validation fails
     */
    validate() {
        if (!this.props.userId) {
            throw new Error('User ID is required');
        }

        if (!this.props.name || this.props.name.trim() === '') {
            throw new Error('Model name is required');
        }

        if (this.props.name.length > 100) {
            throw new Error('Model name must be less than 100 characters');
        }

        const validGenders = ['male', 'female', 'unisex'];
        if (!validGenders.includes(this.props.gender)) {
            throw new Error('Invalid gender');
        }

        if (typeof this.props.isPublic !== 'boolean') {
            throw new Error('isPublic must be a boolean');
        }

        if (typeof this.props.usageCount !== 'number' || this.props.usageCount < 0) {
            throw new Error('Usage count must be a non-negative number');
        }

        if (typeof this.props.likes !== 'number' || this.props.likes < 0) {
            throw new Error('Likes must be a non-negative number');
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

    get description() {
        return this.props.description;
    }

    get thumbnailUrl() {
        return this.props.thumbnailUrl;
    }

    get gender() {
        return this.props.gender;
    }

    get ethnicity() {
        return this.props.ethnicity;
    }

    get ageRange() {
        return this.props.ageRange;
    }

    get isPublic() {
        return this.props.isPublic;
    }

    get usageCount() {
        return this.props.usageCount;
    }

    get likes() {
        return this.props.likes;
    }

    get tags() {
        return this.props.tags;
    }

    get metadata() {
        return this.props.metadata;
    }

    get generationStatus() {
        return this.props.generationStatus;
    }

    get replicateJobId() {
        return this.props.replicateJobId;
    }

    get generationStartedAt() {
        return this.props.generationStartedAt;
    }

    get generationError() {
        return this.props.generationError;
    }

    get prompt() {
        return this.props.prompt;
    }

    get parametersJson() {
        return this.props.parametersJson;
    }

    get createdAt() {
        return this.props.createdAt;
    }

    get updatedAt() {
        return this.props.updatedAt;
    }

    // ========================================================
    // Generation Lifecycle Methods
    // ========================================================

    /**
     * Start a generation job
     * @param {string} jobId - Replicate prediction ID
     * @param {string} prompt - Generation prompt
     * @param {Object} params - Generation parameters
     */
    startGeneration(jobId, prompt, params) {
        this.props.generationStatus = 'processing';
        this.props.replicateJobId = jobId;
        this.props.prompt = prompt;
        this.props.parametersJson = params || {};
        this.props.generationStartedAt = new Date();
        this.props.generationError = null;
        this.props.updatedAt = new Date();
    }

    /**
     * Mark generation as completed
     * @param {string} thumbnailUrl - Generated image URL
     */
    completeGeneration(thumbnailUrl) {
        if (!thumbnailUrl) {
            throw new Error('Thumbnail URL is required to complete generation');
        }
        this.props.generationStatus = 'completed';
        this.props.thumbnailUrl = thumbnailUrl;
        this.props.generationError = null;
        this.props.updatedAt = new Date();
    }

    /**
     * Mark generation as failed
     * @param {string} errorMessage - Error description
     */
    failGeneration(errorMessage) {
        this.props.generationStatus = 'failed';
        this.props.generationError = errorMessage || 'Generation failed';
        this.props.updatedAt = new Date();
    }

    /**
     * Reset generation state (allow retry)
     */
    resetGeneration() {
        this.props.generationStatus = 'idle';
        this.props.replicateJobId = null;
        this.props.generationStartedAt = null;
        this.props.generationError = null;
        this.props.updatedAt = new Date();
    }

    /**
     * Check if model is currently generating
     * @returns {boolean}
     */
    isGenerating() {
        return this.props.generationStatus === 'processing';
    }

    // ========================================================
    // Business Logic Methods
    // ========================================================

    /**
     * Make model public (visible in marketplace)
     */
    makePublic() {
        this.props.isPublic = true;
        this.props.updatedAt = new Date();
    }

    /**
     * Make model private (only owner can see)
     */
    makePrivate() {
        this.props.isPublic = false;
        this.props.updatedAt = new Date();
    }

    /**
     * Update model visibility
     * @param {boolean} isPublic - New visibility state
     */
    updateVisibility(isPublic) {
        if (typeof isPublic !== 'boolean') {
            throw new Error('isPublic must be a boolean');
        }
        this.props.isPublic = isPublic;
        this.props.updatedAt = new Date();
    }

    /**
     * Increment usage count (when model is used for generation)
     */
    incrementUsageCount() {
        this.props.usageCount += 1;
        this.props.updatedAt = new Date();
    }

    /**
     * Increment likes (for public models)
     * @throws {Error} If model is not public
     */
    incrementLikes() {
        if (!this.props.isPublic) {
            throw new Error('Cannot like a private model');
        }
        this.props.likes += 1;
        this.props.updatedAt = new Date();
    }

    /**
     * Decrement likes (for public models)
     * @throws {Error} If model is not public
     */
    decrementLikes() {
        if (!this.props.isPublic) {
            throw new Error('Cannot unlike a private model');
        }
        if (this.props.likes > 0) {
            this.props.likes -= 1;
            this.props.updatedAt = new Date();
        }
    }

    /**
     * Update model details
     * @param {Object} updates - Properties to update
     */
    updateDetails(updates) {
        const allowedUpdates = ['name', 'description', 'thumbnailUrl', 'gender', 'ethnicity', 'ageRange', 'tags', 'metadata'];

        Object.keys(updates).forEach(key => {
            if (allowedUpdates.includes(key)) {
                this.props[key] = updates[key];
            }
        });

        this.props.updatedAt = new Date();
        this.validate(); // Re-validate after updates
    }

    /**
     * Add a tag to the model
     * @param {string} tag - Tag to add
     */
    addTag(tag) {
        if (!tag || tag.trim() === '') {
            throw new Error('Tag cannot be empty');
        }

        const normalizedTag = tag.trim().toLowerCase();
        if (!this.props.tags.includes(normalizedTag)) {
            this.props.tags.push(normalizedTag);
            this.props.updatedAt = new Date();
        }
    }

    /**
     * Remove a tag from the model
     * @param {string} tag - Tag to remove
     */
    removeTag(tag) {
        const normalizedTag = tag.trim().toLowerCase();
        const index = this.props.tags.indexOf(normalizedTag);
        if (index > -1) {
            this.props.tags.splice(index, 1);
            this.props.updatedAt = new Date();
        }
    }

    /**
     * Check if model is owned by a specific user
     * @param {string} userId - User ID to check
     * @returns {boolean}
     */
    isOwnedBy(userId) {
        return this.props.userId === userId;
    }

    /**
     * Check if model can be viewed by a user
     * @param {string} userId - User ID
     * @returns {boolean}
     */
    canBeViewedBy(userId) {
        return this.props.isPublic || this.isOwnedBy(userId);
    }

    /**
     * Convert model to plain object
     * @returns {Object}
     */
    toObject() {
        return {
            id: this.id,
            userId: this.userId,
            name: this.name,
            description: this.description,
            thumbnailUrl: this.thumbnailUrl,
            gender: this.gender,
            ethnicity: this.ethnicity,
            ageRange: this.ageRange,
            isPublic: this.isPublic,
            usageCount: this.usageCount,
            likes: this.likes,
            tags: this.tags,
            metadata: this.metadata,
            generationStatus: this.generationStatus,
            replicateJobId: this.replicateJobId,
            generationStartedAt: this.generationStartedAt,
            generationError: this.generationError,
            prompt: this.prompt,
            parametersJson: this.parametersJson,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
