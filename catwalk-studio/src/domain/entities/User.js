import { Entity } from './Entity.js';

/**
 * User Domain Entity
 * Represents a user in the system with business logic for credit management
 * 
 * Business Rules:
 * - Credit balance cannot be negative
 * - Email must be valid
 * - Subscription tier must be one of: free, pro, enterprise
 */
export class User extends Entity {
    /**
     * Create a User entity
     * @param {Object} props - User properties
     * @param {string} props.email - User email
     * @param {string} props.displayName - Display name
     * @param {string} [props.avatarUrl] - Avatar URL
     * @param {number} props.creditBalance - Credit balance (default: 100)
     * @param {string} props.subscriptionTier - Subscription tier (free|pro|enterprise)
     * @param {boolean} [props.isModel] - Is this user a model
     * @param {boolean} [props.isElite] - Is this an elite model
     * @param {boolean} [props.isGuest] - Is this a guest user
     * @param {Date} [props.createdAt] - Creation timestamp
     * @param {Date} [props.updatedAt] - Last update timestamp
     * @param {string} [id] - User ID (auto-generated if not provided)
     */
    constructor(props, id) {
        super(props, id);
        this.validate();
    }

    /**
     * Factory method to create a User
     * @param {Object} props - User properties
     * @param {string} [id] - Optional ID
     * @returns {User}
     */
    static create(props, id) {
        const defaultProps = {
            creditBalance: 100,
            subscriptionTier: 'free',
            isModel: false,
            isElite: false,
            isGuest: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...props
        };

        return new User(defaultProps, id);
    }

    /**
     * Validate user properties
     * @throws {Error} If validation fails
     */
    validate() {
        if (!this.props.isGuest) {
            if (!this.props.email || !this.isValidEmail(this.props.email)) {
                throw new Error('Invalid email address');
            }
        }

        if (this.props.creditBalance < 0) {
            throw new Error('Credit balance cannot be negative');
        }

        const validTiers = ['free', 'pro', 'enterprise'];
        if (!validTiers.includes(this.props.subscriptionTier)) {
            throw new Error(`Invalid subscription tier. Must be one of: ${validTiers.join(', ')}`);
        }
    }

    /**
     * Simple email validation
     * @param {string} email
     * @returns {boolean}
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // ========================================================
    // Getters
    // ========================================================

    get email() {
        return this.props.email;
    }

    get displayName() {
        return this.props.displayName;
    }

    get avatarUrl() {
        return this.props.avatarUrl;
    }

    get creditBalance() {
        return this.props.creditBalance;
    }

    get subscriptionTier() {
        return this.props.subscriptionTier;
    }

    get isModel() {
        return this.props.isModel;
    }

    get isElite() {
        return this.props.isElite;
    }

    get isGuest() {
        return this.props.isGuest;
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
     * Check if user can afford a certain cost
     * @param {number} cost - Amount to check
     * @returns {boolean}
     */
    canAfford(cost) {
        if (typeof cost !== 'number' || cost < 0) {
            throw new Error('Cost must be a non-negative number');
        }
        return this.props.creditBalance >= cost;
    }

    /**
     * Deduct credits from user balance
     * @param {number} amount - Amount to deduct
     * @throws {Error} If insufficient credits or invalid amount
     */
    deductCredits(amount) {
        if (typeof amount !== 'number' || amount < 0) {
            throw new Error('Amount must be a non-negative number');
        }

        if (!this.canAfford(amount)) {
            throw new Error(`Insufficient credits. Required: ${amount}, Available: ${this.props.creditBalance}`);
        }

        this.props.creditBalance -= amount;
        this.props.updatedAt = new Date();
    }

    /**
     * Add credits to user balance
     * @param {number} amount - Amount to add
     * @throws {Error} If invalid amount
     */
    addCredits(amount) {
        if (typeof amount !== 'number' || amount < 0) {
            throw new Error('Amount must be a non-negative number');
        }

        this.props.creditBalance += amount;
        this.props.updatedAt = new Date();
    }

    /**
     * Update user profile
     * @param {Object} updates - Properties to update
     */
    updateProfile(updates) {
        const allowedUpdates = ['displayName', 'avatarUrl'];

        Object.keys(updates).forEach(key => {
            if (allowedUpdates.includes(key)) {
                this.props[key] = updates[key];
            }
        });

        this.props.updatedAt = new Date();
    }

    /**
     * Upgrade subscription tier
     * @param {string} newTier - New subscription tier
     */
    upgradeSubscription(newTier) {
        const validTiers = ['free', 'pro', 'enterprise'];
        if (!validTiers.includes(newTier)) {
            throw new Error(`Invalid subscription tier. Must be one of: ${validTiers.join(', ')}`);
        }

        const tierLevels = { free: 0, pro: 1, enterprise: 2 };
        if (tierLevels[newTier] <= tierLevels[this.props.subscriptionTier]) {
            throw new Error('Can only upgrade to a higher tier');
        }

        this.props.subscriptionTier = newTier;
        this.props.updatedAt = new Date();
    }

    /**
     * Mark user as model
     */
    becomeModel() {
        this.props.isModel = true;
        this.props.updatedAt = new Date();
    }

    /**
     * Mark user as elite model
     */
    becomeElite() {
        if (!this.props.isModel) {
            throw new Error('User must be a model before becoming elite');
        }
        this.props.isElite = true;
        this.props.updatedAt = new Date();
    }

    /**
     * Convert user to plain object (for DTO)
     * @returns {Object}
     */
    toObject() {
        return {
            id: this.id,
            email: this.email,
            displayName: this.displayName,
            avatarUrl: this.avatarUrl,
            creditBalance: this.creditBalance,
            subscriptionTier: this.subscriptionTier,
            isModel: this.isModel,
            isElite: this.isElite,
            isGuest: this.isGuest,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}
