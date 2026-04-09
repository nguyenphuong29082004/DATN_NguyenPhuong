import { Entity } from './Entity.js';

/**
 * Collection Domain Entity
 * Represents a user-created collection (outfit/wardrobe collection)
 * 
 * Business Rules:
 * - Collections belong to a user
 * - Collections can contain multiple designer items
 * - Collections can be public or private
 * - Public collections can be liked
 */
export class Collection extends Entity {
    /**
     * Create a Collection entity
     * @param {Object} props - Collection properties
     * @param {string} props.userId - Owner user ID
     * @param {string} props.name - Collection name
     * @param {string} [props.description] - Collection description
     * @param {boolean} [props.isPublic] - Whether collection is public
     * @param {Array<string>} [props.itemIds] - Array of designer item IDs
     * @param {number} [props.likes] - Number of likes
     * @param {Array<string>} [props.tags] - Collection tags
     * @param {Date} [props.createdAt] - Creation timestamp
     * @param {Date} [props.updatedAt] - Last update timestamp
     * @param {string} [id] - Collection ID
     */
    constructor(props, id) {
        super(props, id);
        this.validate();
    }

    /**
     * Factory method to create a Collection
     * @param {Object} props - Collection properties
     * @param {string} [id] - Optional ID
     * @returns {Collection}
     */
    static create(props, id) {
        const defaultProps = {
            description: '',
            isPublic: false,
            itemIds: [],
            likes: 0,
            tags: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            ...props
        };

        return new Collection(defaultProps, id);
    }

    /**
     * Validate collection properties
     * @throws {Error} If validation fails
     */
    validate() {
        if (!this.props.userId) {
            throw new Error('User ID is required');
        }

        if (!this.props.name || this.props.name.trim() === '') {
            throw new Error('Collection name is required');
        }

        if (this.props.name.length > 100) {
            throw new Error('Collection name must be less than 100 characters');
        }

        if (!Array.isArray(this.props.itemIds)) {
            throw new Error('itemIds must be an array');
        }

        if (typeof this.props.isPublic !== 'boolean') {
            throw new Error('isPublic must be a boolean');
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

    get isPublic() {
        return this.props.isPublic;
    }

    get itemIds() {
        return this.props.itemIds;
    }

    get likes() {
        return this.props.likes;
    }

    get tags() {
        return this.props.tags;
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
     * Add an item to the collection
     * @param {string} itemId - Designer item ID
     */
    addItem(itemId) {
        if (!itemId || itemId.trim() === '') {
            throw new Error('Item ID cannot be empty');
        }

        if (this.props.itemIds.includes(itemId)) {
            throw new Error('Item already exists in collection');
        }

        this.props.itemIds.push(itemId);
        this.props.updatedAt = new Date();
    }

    /**
     * Remove an item from the collection
     * @param {string} itemId - Designer item ID
     */
    removeItem(itemId) {
        const index = this.props.itemIds.indexOf(itemId);
        if (index > -1) {
            this.props.itemIds.splice(index, 1);
            this.props.updatedAt = new Date();
        }
    }

    /**
     * Check if collection contains an item
     * @param {string} itemId - Designer item ID
     * @returns {boolean}
     */
    hasItem(itemId) {
        return this.props.itemIds.includes(itemId);
    }

    /**
     * Get number of items in collection
     * @returns {number}
     */
    getItemCount() {
        return this.props.itemIds.length;
    }

    /**
     * Make collection public
     */
    makePublic() {
        this.props.isPublic = true;
        this.props.updatedAt = new Date();
    }

    /**
     * Make collection private
     */
    makePrivate() {
        this.props.isPublic = false;
        this.props.updatedAt = new Date();
    }

    /**
     * Update collection visibility
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
     * Increment likes (for public collections)
     * @throws {Error} If collection is not public
     */
    incrementLikes() {
        if (!this.props.isPublic) {
            throw new Error('Cannot like a private collection');
        }
        this.props.likes += 1;
        this.props.updatedAt = new Date();
    }

    /**
     * Decrement likes
     */
    decrementLikes() {
        if (!this.props.isPublic) {
            throw new Error('Cannot unlike a private collection');
        }
        if (this.props.likes > 0) {
            this.props.likes -= 1;
            this.props.updatedAt = new Date();
        }
    }

    /**
     * Update collection details
     * @param {Object} updates - Properties to update
     */
    updateDetails(updates) {
        const allowedUpdates = ['name', 'description', 'tags'];

        Object.keys(updates).forEach(key => {
            if (allowedUpdates.includes(key)) {
                this.props[key] = updates[key];
            }
        });

        this.props.updatedAt = new Date();
        this.validate();
    }

    /**
     * Add a tag to the collection
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
     * Remove a tag from the collection
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
     * Check if collection is owned by a specific user
     * @param {string} userId - User ID to check
     * @returns {boolean}
     */
    isOwnedBy(userId) {
        return this.props.userId === userId;
    }

    /**
     * Check if collection can be viewed by a user
     * @param {string} userId - User ID
     * @returns {boolean}
     */
    canBeViewedBy(userId) {
        return this.props.isPublic || this.isOwnedBy(userId);
    }

    /**
     * Convert collection to plain object
     * @returns {Object}
     */
    toObject() {
        return {
            id: this.id,
            userId: this.userId,
            name: this.name,
            description: this.description,
            isPublic: this.isPublic,
            itemIds: this.itemIds,
            likes: this.likes,
            tags: this.tags,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
