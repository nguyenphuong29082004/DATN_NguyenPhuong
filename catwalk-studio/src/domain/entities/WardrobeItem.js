import { Entity } from './Entity.js';

/**
 * WardrobeItem Domain Entity
 * Represents a clothing item in the wardrobe_items table
 *
 * Business Rules:
 * - Items can be stock (platform default) or user uploaded
 * - Stock items don't require userId
 * - User uploaded items require a userId
 * - Items can have purchase links (buy_url) and a can_buy flag
 */
export class WardrobeItem extends Entity {
    /**
     * Create a WardrobeItem entity
     * @param {Object} props - WardrobeItem properties
     * @param {string} [props.userId] - Owner user ID (optional for stock items)
     * @param {string} props.title - Item title
     * @param {string} props.category - Item category (e.g., 'clothing', 'accessories', 'footwear', 'jewellery')
     * @param {string} [props.brand] - Item brand
     * @param {string} [props.style] - Item style
     * @param {string} [props.colour] - Item colour name
     * @param {string[]} [props.keywords] - Search keywords
     * @param {string} [props.thumbnailUrl] - Thumbnail image URL
     * @param {string} [props.highResImageUrl] - High resolution image URL
     * @param {string} [props.buyUrl] - Purchase URL
     * @param {boolean} [props.isStock] - Whether item is a stock/platform item
     * @param {boolean} [props.isUserUploaded] - Whether item was uploaded by user
     * @param {string} [props.imageId] - External image ID
     * @param {string} [props.altText] - Image alt text
     * @param {string} [props.colourHex] - Hex colour code
     * @param {string} [props.description] - Item description
     * @param {string} [props.gender] - Target gender
     * @param {boolean} [props.canBuy] - Whether item can be purchased
     * @param {Date} [props.createdAt] - Creation timestamp
     * @param {Date} [props.updatedAt] - Last update timestamp
     * @param {string} [id] - WardrobeItem ID (item_id)
     */
    constructor(props, id) {
        super(props, id);
        this.validate();
    }

    /**
     * Factory method to create a WardrobeItem
     * @param {Object} props - WardrobeItem properties
     * @param {string} [id] - Optional ID
     * @returns {WardrobeItem}
     */
    static create(props, id) {
        const defaultProps = {
            userId: null,
            brand: null,
            style: null,
            colour: null,
            keywords: [],
            thumbnailUrl: null,
            highResImageUrl: null,
            buyUrl: null,
            isStock: false,
            isUserUploaded: false,
            imageId: null,
            altText: null,
            colourHex: null,
            description: null,
            gender: null,
            canBuy: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...props
        };

        return new WardrobeItem(defaultProps, id);
    }

    /**
     * Validate wardrobe item properties
     * @throws {Error} If validation fails
     */
    validate() {
        // userId is optional for stock items
        if (!this.props.userId && !this.props.isStock) {
            // Allow if it's a stock item without userId
        }

        if (!this.props.title || this.props.title.trim() === '') {
            throw new Error('Item title is required');
        }

        if (this.props.title.length > 200) {
            throw new Error('Item title must be less than 200 characters');
        }

        if (!this.props.category || this.props.category.trim() === '') {
            throw new Error('Category is required');
        }

        if (this.props.category.length > 100) {
            throw new Error('Category must be less than 100 characters');
        }
    }

    // ========================================================
    // Getters
    // ========================================================

    get userId() {
        return this.props.userId;
    }

    get title() {
        return this.props.title;
    }

    /** @deprecated Use title instead */
    get name() {
        return this.props.title;
    }

    get category() {
        return this.props.category;
    }

    get brand() {
        return this.props.brand;
    }

    get style() {
        return this.props.style;
    }

    get colour() {
        return this.props.colour;
    }

    get keywords() {
        return this.props.keywords;
    }

    get thumbnailUrl() {
        return this.props.thumbnailUrl;
    }

    get highResImageUrl() {
        return this.props.highResImageUrl;
    }

    /** Backwards compatibility: returns thumbnailUrl */
    get imageUrl() {
        return this.props.thumbnailUrl;
    }

    get buyUrl() {
        return this.props.buyUrl;
    }

    get isStock() {
        return this.props.isStock;
    }

    get isUserUploaded() {
        return this.props.isUserUploaded;
    }

    get imageId() {
        return this.props.imageId;
    }

    get altText() {
        return this.props.altText;
    }

    get colourHex() {
        return this.props.colourHex;
    }

    get description() {
        return this.props.description;
    }

    get gender() {
        return this.props.gender;
    }

    get canBuy() {
        return this.props.canBuy;
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
        const allowedUpdates = [
            'title', 'category', 'brand', 'style', 'colour',
            'keywords', 'thumbnailUrl', 'highResImageUrl', 'buyUrl',
            'isStock', 'isUserUploaded', 'imageId', 'altText',
            'colourHex', 'description', 'gender', 'canBuy',
        ];

        Object.keys(updates).forEach(key => {
            if (allowedUpdates.includes(key)) {
                this.props[key] = updates[key];
            }
        });

        this.props.updatedAt = new Date();
        this.validate();
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
     * Check if item is a platform stock item
     * @returns {boolean}
     */
    isPlatformStock() {
        return this.props.isStock;
    }

    /**
     * Convert wardrobe item to plain object
     * @returns {Object}
     */
    toObject() {
        return {
            id: this.id,
            userId: this.userId,
            title: this.title,
            category: this.category,
            brand: this.brand,
            style: this.style,
            colour: this.colour,
            keywords: this.keywords,
            thumbnailUrl: this.thumbnailUrl,
            highResImageUrl: this.highResImageUrl,
            buyUrl: this.buyUrl,
            isStock: this.isStock,
            isUserUploaded: this.isUserUploaded,
            imageId: this.imageId,
            altText: this.altText,
            colourHex: this.colourHex,
            description: this.description,
            gender: this.gender,
            canBuy: this.canBuy,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
