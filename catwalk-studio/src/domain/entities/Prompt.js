import { Entity } from './Entity.js';

/**
 * Prompt Domain Entity
 * Represents a reusable prompt template in the system
 *
 * Business Rules:
 * - Prompt must have a name and prompt text
 * - Prompts can be public, system, or private
 * - System prompts are managed by admins
 * - Public prompts are visible to all users
 * - Private prompts are only visible to the owner
 */
export class Prompt extends Entity {
    /**
     * Create a Prompt entity
     * @param {Object} props - Prompt properties
     * @param {string} props.userId - Owner user ID
     * @param {string} props.name - Prompt name
     * @param {string} props.promptText - The prompt text/template
     * @param {string} [props.negativePrompt] - Negative prompt text
     * @param {Object} [props.parametersJson] - Generation parameters (width, height, etc.)
     * @param {string} [props.description] - Prompt description
     * @param {string} [props.category] - Prompt category
     * @param {boolean} [props.isPublic] - Whether prompt is public
     * @param {boolean} [props.isSystem] - Whether prompt is a system prompt
     * @param {number} [props.useCount] - Number of times used
     * @param {Array<string>} [props.tags] - Prompt tags
     * @param {Object} [props.metadata] - Additional metadata
     * @param {Date} [props.createdAt] - Creation timestamp
     * @param {Date} [props.updatedAt] - Last update timestamp
     * @param {string} [id] - Prompt ID
     */
    constructor(props, id) {
        super(props, id);
        this.validate();
    }

    /**
     * Factory method to create a Prompt
     * @param {Object} props - Prompt properties
     * @param {string} [id] - Optional ID
     * @returns {Prompt}
     */
    static create(props, id) {
        const defaultProps = {
            negativePrompt: null,
            parametersJson: {},
            description: '',
            category: null,
            isPublic: false,
            isSystem: false,
            useCount: 0,
            tags: [],
            metadata: {},
            createdAt: new Date(),
            updatedAt: new Date(),
            ...props
        };

        return new Prompt(defaultProps, id);
    }

    /**
     * Validate prompt properties
     * @throws {Error} If validation fails
     */
    validate() {
        if (!this.props.userId && !this.props.isSystem && !this.props.isPublic) {
            throw new Error('User ID is required for private prompts');
        }

        if (!this.props.name || this.props.name.trim() === '') {
            throw new Error('Prompt name is required');
        }

        if (this.props.name.length > 200) {
            throw new Error('Prompt name must be less than 200 characters');
        }

        if (!this.props.promptText || this.props.promptText.trim() === '') {
            throw new Error('Prompt text is required');
        }

        if (typeof this.props.isPublic !== 'boolean') {
            throw new Error('isPublic must be a boolean');
        }

        if (typeof this.props.isSystem !== 'boolean') {
            throw new Error('isSystem must be a boolean');
        }

        if (typeof this.props.useCount !== 'number' || this.props.useCount < 0) {
            throw new Error('Use count must be a non-negative number');
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

    get promptText() {
        return this.props.promptText;
    }

    get negativePrompt() {
        return this.props.negativePrompt;
    }

    get parametersJson() {
        return this.props.parametersJson;
    }

    get description() {
        return this.props.description;
    }

    get category() {
        return this.props.category;
    }

    get isPublic() {
        return this.props.isPublic;
    }

    get isSystem() {
        return this.props.isSystem;
    }

    get useCount() {
        return this.props.useCount;
    }

    get tags() {
        return this.props.tags;
    }

    get metadata() {
        return this.props.metadata;
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
     * Update prompt details
     * @param {Object} updates - Properties to update
     */
    updateDetails(updates) {
        const allowedUpdates = ['name', 'promptText', 'description', 'category', 'isPublic', 'tags', 'metadata'];

        Object.keys(updates).forEach(key => {
            if (allowedUpdates.includes(key)) {
                this.props[key] = updates[key];
            }
        });

        this.props.updatedAt = new Date();
        this.validate();
    }

    /**
     * Increment use count
     */
    incrementUseCount() {
        this.props.useCount += 1;
        this.props.updatedAt = new Date();
    }

    /**
     * Check if prompt is owned by a specific user
     * @param {string} userId - User ID to check
     * @returns {boolean}
     */
    isOwnedBy(userId) {
        return this.props.userId === userId;
    }

    /**
     * Convert prompt to plain object
     * @returns {Object}
     */
    toObject() {
        return {
            id: this.id,
            userId: this.userId,
            name: this.name,
            promptText: this.promptText,
            negativePrompt: this.negativePrompt,
            parametersJson: this.parametersJson,
            description: this.description,
            category: this.category,
            isPublic: this.isPublic,
            isSystem: this.isSystem,
            useCount: this.useCount,
            tags: this.tags,
            metadata: this.metadata,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
