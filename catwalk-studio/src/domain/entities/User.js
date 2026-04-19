import { Entity } from './Entity.js';

/**
 * User Domain Entity
 * Represents a user in the system with business logic for credit management and B2B features.
 */
export class User extends Entity {
    /**
     * Create a User entity
     * @param {Object} props - User properties
     * @param {string} props.email - User email
     * @param {string} [props.username] - Username
     * @param {string} [props.displayName] - Display name
     * @param {string} [props.bio] - User biography
     * @param {string} [props.avatarUrl] - Avatar URL
     * @param {string} [props.companyName] - Company name (B2B)
     * @param {string} [props.country] - Country (B2B)
     * @param {string} [props.taxId] - Tax ID / VAT (B2B)
     * @param {number} props.credits - Credit balance (default: 100)
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
            credits: 100,
            subscriptionTier: 'free',
            isModel: false,
            isElite: false,
            isGuest: false,
            companyName: null,
            country: null,
            taxId: null,
            bio: '',
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
                throw new Error('Invalid email format'); // Matches test expectation
            }
        }

        if (this.props.credits < 0) {
            throw new Error('Credits cannot be negative'); // Matches test expectation
        }

        const validTiers = ['free', 'pro', 'enterprise'];
        if (!validTiers.includes(this.props.subscriptionTier)) {
            throw new Error('Invalid subscription tier'); // Matches test expectation
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

    get email() { return this.props.email; }
    get username() { return this.props.username; }
    get displayName() { return this.props.displayName; }
    get bio() { return this.props.bio; }
    get avatarUrl() { return this.props.avatarUrl; }
    get credits() { return this.props.credits; }
    get creditBalance() { return this.props.credits; } // Alias for backward compatibility
    get subscriptionTier() { return this.props.subscriptionTier; }
    get isModel() { return this.props.isModel; }
    get isElite() { return this.props.isElite; }
    get isGuest() { return this.props.isGuest; }
    get companyName() { return this.props.companyName; }
    get country() { return this.props.country; }
    get taxId() { return this.props.taxId; }
    get createdAt() { return this.props.createdAt; }
    get updatedAt() { return this.props.updatedAt; }

    // ========================================================
    // Business Logic Methods
    // ========================================================

    /**
     * Check if user can afford a certain cost
     */
    canAfford(cost) {
        if (typeof cost !== 'number' || cost < 0) {
            throw new Error('Cost must be a non-negative number');
        }
        return this.props.credits >= cost;
    }

    /**
     * Deduct credits from user balance
     */
    deductCredits(amount) {
        if (typeof amount !== 'number' || amount <= 0) {
            throw new Error('Amount must be positive'); // Matches test expectation
        }

        if (!this.canAfford(amount)) {
            throw new Error('Insufficient credits'); // Matches test expectation
        }

        this.props.credits -= amount;
        this.props.updatedAt = new Date();
    }

    /**
     * Add credits to user balance
     */
    addCredits(amount) {
        if (typeof amount !== 'number' || amount <= 0) {
            throw new Error('Amount must be positive'); // Matches test expectation
        }

        this.props.credits += amount;
        this.props.updatedAt = new Date();
    }

    /**
     * Update user profile
     */
    updateProfile(updates) {
        const allowedUpdates = ['displayName', 'avatarUrl', 'bio', 'companyName', 'country', 'taxId'];

        Object.keys(updates).forEach(key => {
            if (allowedUpdates.includes(key)) {
                this.props[key] = updates[key];
            }
        });

        this.props.updatedAt = new Date();
    }

    /**
     * Update subscription tier
     */
    updateSubscriptionTier(newTier) {
        const validTiers = ['free', 'pro', 'enterprise'];
        if (!validTiers.includes(newTier)) {
            throw new Error('Invalid subscription tier');
        }

        this.props.subscriptionTier = newTier;
        this.props.updatedAt = new Date();
    }

    /** Alias for backward compatibility */
    upgradeSubscription(newTier) {
        this.updateSubscriptionTier(newTier);
    }

    /**
     * Check if user is on pro tier or higher
     */
    isProSubscriber() {
        return this.props.subscriptionTier === 'pro' || this.props.subscriptionTier === 'enterprise';
    }

    /**
     * Check if user is on free tier
     */
    isFreeTier() {
        return this.props.subscriptionTier === 'free';
    }

    /**
     * Grant welcome bonus to new users
     */
    grantWelcomeBonus() {
        const bonusAmount = 50;
        this.props.credits += bonusAmount;
        this.props.updatedAt = new Date();
    }

    /**
     * Check if essential profile fields are filled
     */
    isProfileComplete() {
        return !!(this.props.displayName && this.props.bio && this.props.avatarUrl);
    }

    /**
     * Convert user to plain object (for DTO)
     */
    toObject() {
        return {
            id: this.id,
            email: this.email,
            username: this.username,
            displayName: this.displayName,
            bio: this.bio,
            avatarUrl: this.avatarUrl,
            credits: this.credits,
            subscriptionTier: this.subscriptionTier,
            isModel: this.isModel,
            isElite: this.isElite,
            isGuest: this.isGuest,
            companyName: this.companyName,
            country: this.country,
            taxId: this.taxId,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}
