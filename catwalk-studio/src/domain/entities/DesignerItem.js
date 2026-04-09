import { Entity } from './Entity.js';

/**
 * DesignerItem Domain Entity
 * Represents a designer item (clothing, accessory, etc.) in the wardrobe
 * 
 * Business Rules:
 * - Items belong to a user
 * - Items have a category (top, bottom, shoes, accessories, etc.)
 * - Items can have images
 * - Items can belong to multiple collections
 */
export class DesignerItem extends Entity {
    /**
     * Create a DesignerItem entity
     * @param {Object} props - Item properties
     * @param {string} props.userId - Owner user ID
     * @param {string} props.name - Item name
     * @param {string} props.category - Item category
     * @param {string} [props.description] - Item description
     * @param {string} [props.imageUrl] - Item image URL
     * @param {string} [props.color] - Item color
     * @param {string} [props.brand] - Item brand
     * @param {Array<string>} [props.tags] - Item tags
     * @param {Object} [props.metadata] - Additional metadata
     * @param {Date} [props.createdAt] - Creation timestamp
     * @param {Date} [props.updatedAt] - Last update timestamp
     * @param {string} [id] - Item ID
     */
    constructor(props, id) {
        super(props, id);
        this.validate();
    }

    /**
     * Factory method to create a DesignerItem
     * @param {Object} props - Item properties
     * @param {string} [id] - Optional ID
     * @returns {DesignerItem}
     */
    static create(props, id) {
        const defaultProps = {
            description: '',
            imageUrl: null,
            color: null,
            brand: null,
            tags: [],
            metadata: {},
            createdAt: new Date(),
            updatedAt: new Date(),
            ...props
        };

        return new DesignerItem(defaultProps, id);
    }

    /**
     * Validate item properties
     * @throws {Error} If validation fails
     */
    validate() {
        if (!this.props.userId) {
            throw new Error('User ID is required');
        }

        if (!this.props.name || this.props.name.trim() === '') {
            throw new Error('Item name is required');
        }

        if (this.props.name.length > 100) {
            throw new Error('Item name must be less than 100 characters');
        }

        if (!this.props.category || this.props.category.trim() === '') {
            throw new Error('Item category is required');
        }

        const validCategories = ['top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessories', 'other'];
        if (!validCategories.includes(this.props.category)) {
            throw new Error('Invalid category. Must be: top, bottom, dress, outerwear, shoes, accessories, or other');
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

    get category() {
        return this.props.category;
    }

    get description() {
        return this.props.description;
    }

    get imageUrl() {
        return this.props.imageUrl;
    }

    get color() {
        return this.props.color;
    }

    get brand() {
        return this.props.brand;
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
     * Update item details
     * @param {Object} updates - Properties to update
     */
    updateDetails(updates) {
        const allowedUpdates = ['name', 'description', 'imageUrl', 'color', 'brand', 'tags', 'metadata'];

        Object.keys(updates).forEach(key => {
            if (allowedUpdates.includes(key)) {
                this.props[key] = updates[key];
            }
        });

        this.props.updatedAt = new Date();
        this.validate();
    }

    /**
     * Add a tag to the item
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
     * Remove a tag from the item
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
     * Check if item is owned by a specific user
     * @param {string} userId - User ID to check
     * @returns {boolean}
     */
    isOwnedBy(userId) {
        return this.props.userId === userId;
    }

    /**
     * Check if item matches a category
     * @param {string} category - Category to check
     * @returns {boolean}
     */
    isCategory(category) {
        return this.props.category === category;
    }

    /**
     * Convert item to plain object
     * @returns {Object}
     */
    toObject() {
        return {
            id: this.id,
            userId: this.userId,
            name: this.name,
            category: this.category,
            description: this.description,
            imageUrl: this.imageUrl,
            color: this.color,
            brand: this.brand,
            tags: this.tags,
            metadata: this.metadata,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
