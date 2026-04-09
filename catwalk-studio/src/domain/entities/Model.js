import { Entity } from './Entity.js';

/**
 * Model Domain Entity
 * Represents a fashion model (human or AI) in the system
 * Maps to the `models` table in DB
 * 
 * Business Rules:
 * - Model can be AI-generated, Real, or Both
 * - Elite models appear first in marketplace listings
 * - Elite status expires (elite_exp_date)
 * - Models go through review before becoming active
 * - Real models can be booked, AI models can be used for shoots
 */
export class Model extends Entity {
    /**
     * @param {Object} props
     * @param {string} props.displayName
     * @param {string} [props.username]
     * @param {string} [props.profileUrl]
     * @param {string} [props.status] - in_review | active | paused | deleted
     * @param {boolean} [props.isFlagged]
     * @param {string[]} [props.modelTypes] - e.g. ['editorial', 'runway']
     * @param {string[]} [props.modellingType]
     * @param {boolean} [props.isAi]
     * @param {string} [props.aiModelId] - FK to aimodel_mapper
     * @param {string} [props.profileImageUrl]
     * @param {string} [props.videoUrl]
     * @param {string[]} [props.galleryImageUrls]
     * @param {string} [props.description]
     * @param {string[]} [props.styleTags]
     * @param {boolean} [props.canBook]
     * @param {string} [props.bookUrl]
     * @param {boolean} [props.canTravel]
     * @param {number} [props.hourlyRate]
     * @param {number} [props.halfDayRate]
     * @param {number} [props.fullDayRate]
     * @param {string} [props.currency]
     * @param {boolean} [props.elite]
     * @param {Date} [props.eliteExpDate]
     * @param {number} [props.pricePerImage]
     * @param {number} [props.pricePerVideo]
     * @param {number} [props.royaltySplitPercent]
     * @param {string} [props.licenseTerms]
     * @param {string} [props.usageRights]
     * @param {number} [props.monthlyTarget]
     * @param {Array} [props.socialLinks]
     * @param {Array} [props.locations]
     * @param {Array} [props.trainingData]
     * @param {string} [props.accountType] - 'ai_only' | 'real_only' | 'both'
     * @param {string} [props.modelType] - 'ai' | 'real' | 'both'
     * @param {boolean} [props.isElite]
     * @param {number} [props.aiGenerationCost]
     * @param {number} [props.realBookingCost]
     * @param {Array} [props.contentPreferences] - e.g. ['fashion_editorial', 'commercial']
     * @param {string} [props.location] - Location for real bookings
     * @param {Date} [props.createdAt]
     * @param {Date} [props.updatedAt]
     * @param {string} [props.gender]
     * @param {string} [props.ethnicity]
     * @param {string} [props.bodyType]
     * @param {string} [props.ageRange]
     * @param {string} [id]
     */
    constructor(props, id) {
        super(props, id);

        this._displayName = props.displayName;
        this._username = props.username || null;
        this._profileUrl = props.profileUrl || null;
        this._status = props.status || 'in_review';
        this._isFlagged = props.isFlagged || false;
        this._modelTypes = props.modelTypes || [];
        this._modellingType = props.modellingType || [];
        this._isAi = props.isAi || false;
        this._aiModelId = props.aiModelId || null;
        this._profileImageUrl = props.profileImageUrl || null;
        this._videoUrl = props.videoUrl || null;
        this._galleryImageUrls = props.galleryImageUrls || [];
        this._description = props.description || null;
        this._styleTags = props.styleTags || [];
        this._canBook = props.canBook || false;
        this._bookUrl = props.bookUrl || null;
        this._canTravel = props.canTravel || false;
        this._hourlyRate = props.hourlyRate ?? null;
        this._halfDayRate = props.halfDayRate ?? null;
        this._fullDayRate = props.fullDayRate ?? null;
        this._currency = props.currency || 'GBP';
        this._elite = props.elite || false;
        this._eliteExpDate = props.eliteExpDate ? new Date(props.eliteExpDate) : null;
        this._pricePerImage = props.pricePerImage ?? null;
        this._pricePerVideo = props.pricePerVideo ?? null;
        this._royaltySplitPercent = props.royaltySplitPercent ?? null;
        this._licenseTerms = props.licenseTerms || null;
        this._usageRights = props.usageRights || null;
        this._monthlyTarget = props.monthlyTarget ?? null;
        this._socialLinks = props.socialLinks || [];
        this._locations = props.locations || [];
        this._trainingData = props.trainingData || [];
        this._accountType = props.accountType || 'both';
        this._modelType = props.modelType || 'both';
        this._isElite = props.isElite || false;
        this._aiGenerationCost = props.aiGenerationCost ?? 5;
        this._realBookingCost = props.realBookingCost ?? 1000;
        this._contentPreferences = props.contentPreferences || [];
        this._location = props.location || null;
        this._gender = props.gender || null;
        this._ethnicity = props.ethnicity || null;
        this._bodyType = props.bodyType || null;
        this._ageRange = props.ageRange || null;
        this._createdByUserId = props.createdByUserId || null;
        this._createdAt = props.createdAt ? new Date(props.createdAt) : new Date();
        this._updatedAt = props.updatedAt ? new Date(props.updatedAt) : new Date();
    }

    /**
     * Factory method
     */
    static create(props, id) {
        const model = new Model(props, id);
        model.validate();
        return model;
    }

    validate() {
        if (!this._displayName || typeof this._displayName !== 'string' || !this._displayName.trim()) {
            throw new Error('Display name is required');
        }

        const validStatuses = ['in_review', 'active', 'paused', 'deleted'];
        if (!validStatuses.includes(this._status)) {
            throw new Error(`Invalid status: ${this._status}. Must be one of: ${validStatuses.join(', ')}`);
        }

        if (this._royaltySplitPercent !== null && (this._royaltySplitPercent < 0 || this._royaltySplitPercent > 100)) {
            throw new Error('Royalty split percent must be between 0 and 100');
        }
    }

    // --- Getters ---
    get displayName() { return this._displayName; }
    get username() { return this._username; }
    get profileUrl() { return this._profileUrl; }
    get status() { return this._status; }
    get isFlagged() { return this._isFlagged; }
    get modelTypes() { return [...this._modelTypes]; }
    get modellingType() { return [...this._modellingType]; }
    get isAi() { return this._isAi; }
    get aiModelId() { return this._aiModelId; }
    get profileImageUrl() { return this._profileImageUrl; }
    get videoUrl() { return this._videoUrl; }
    get galleryImageUrls() { return [...this._galleryImageUrls]; }
    get description() { return this._description; }
    get styleTags() { return [...this._styleTags]; }
    get canBook() { return this._canBook; }
    get bookUrl() { return this._bookUrl; }
    get canTravel() { return this._canTravel; }
    get hourlyRate() { return this._hourlyRate; }
    get halfDayRate() { return this._halfDayRate; }
    get fullDayRate() { return this._fullDayRate; }
    get currency() { return this._currency; }
    get elite() { return this._elite; }
    get eliteExpDate() { return this._eliteExpDate; }
    get pricePerImage() { return this._pricePerImage; }
    get pricePerVideo() { return this._pricePerVideo; }
    get royaltySplitPercent() { return this._royaltySplitPercent; }
    get licenseTerms() { return this._licenseTerms; }
    get usageRights() { return this._usageRights; }
    get monthlyTarget() { return this._monthlyTarget; }
    get socialLinks() { return this._socialLinks; }
    get locations() { return this._locations; }
    get trainingData() { return this._trainingData; }
    get accountType() { return this._accountType; }
    get modelType() { return this._modelType; }
    get isElite() { return this._isElite; }
    get aiGenerationCost() { return this._aiGenerationCost; }
    get realBookingCost() { return this._realBookingCost; }
    get contentPreferences() { return [...this._contentPreferences]; }
    get location() { return this._location; }
    get gender() { return this._gender; }
    get ethnicity() { return this._ethnicity; }
    get bodyType() { return this._bodyType; }
    get ageRange() { return this._ageRange; }
    get createdByUserId() { return this._createdByUserId; }
    get createdAt() { return this._createdAt; }
    get updatedAt() { return this._updatedAt; }

    // --- Business Logic ---

    /** Check if elite status is currently active */
    isEliteActive() {
        if (!this._elite) return false;
        if (!this._eliteExpDate) return true; // No expiry = always active
        return this._eliteExpDate > new Date();
    }

    /** Check if model is active and visible */
    isActive() { return this._status === 'active'; }
    isInReview() { return this._status === 'in_review'; }

    /** Activate model (after review) */
    activate() {
        this._status = 'active';
        this._updatedAt = new Date();
    }

    /** Pause model */
    pause() {
        this._status = 'paused';
        this._updatedAt = new Date();
    }

    /** Flag model for review */
    flag() {
        this._isFlagged = true;
        this._updatedAt = new Date();
    }

    /** Unflag model */
    unflag() {
        this._isFlagged = false;
        this._updatedAt = new Date();
    }

    /** Enable elite status */
    enableElite(expiryDate) {
        this._elite = true;
        this._eliteExpDate = expiryDate ? new Date(expiryDate) : null;
        this._updatedAt = new Date();
    }

    /** Disable elite status */
    disableElite() {
        this._elite = false;
        this._eliteExpDate = null;
        this._updatedAt = new Date();
    }

    /** Update details */
    updateDetails(updates) {
        const allowed = [
            'displayName', 'username', 'profileUrl', 'description',
            'profileImageUrl', 'videoUrl', 'galleryImageUrls',
            'modelTypes', 'modellingType', 'styleTags',
            'canBook', 'bookUrl', 'canTravel',
            'hourlyRate', 'halfDayRate', 'fullDayRate', 'currency',
            'pricePerImage', 'pricePerVideo',
            'royaltySplitPercent', 'licenseTerms', 'usageRights',
            'monthlyTarget', 'socialLinks', 'locations', 'trainingData',
            'accountType', 'modelType', 'isElite', 'aiGenerationCost', 
            'realBookingCost', 'contentPreferences', 'location',
            'gender', 'ethnicity', 'bodyType', 'ageRange',
        ];

        for (const [key, value] of Object.entries(updates)) {
            if (allowed.includes(key)) {
                this[`_${key}`] = value;
            }
        }
        this._updatedAt = new Date();
    }

    /** Convert to plain object */
    toObject() {
        return {
            id: this.id,
            displayName: this._displayName,
            username: this._username,
            profileUrl: this._profileUrl,
            status: this._status,
            isFlagged: this._isFlagged,
            modelTypes: this._modelTypes,
            modellingType: this._modellingType,
            isAi: this._isAi,
            aiModelId: this._aiModelId,
            profileImageUrl: this._profileImageUrl,
            videoUrl: this._videoUrl,
            galleryImageUrls: this._galleryImageUrls,
            description: this._description,
            styleTags: this._styleTags,
            canBook: this._canBook,
            bookUrl: this._bookUrl,
            canTravel: this._canTravel,
            hourlyRate: this._hourlyRate,
            halfDayRate: this._halfDayRate,
            fullDayRate: this._fullDayRate,
            currency: this._currency,
            elite: this._elite,
            eliteExpDate: this._eliteExpDate,
            pricePerImage: this._pricePerImage,
            pricePerVideo: this._pricePerVideo,
            royaltySplitPercent: this._royaltySplitPercent,
            licenseTerms: this._licenseTerms,
            usageRights: this._usageRights,
            monthlyTarget: this._monthlyTarget,
            socialLinks: this._socialLinks,
            locations: this._locations,
            trainingData: this._trainingData,
            accountType: this._accountType,
            modelType: this._modelType,
            isElite: this._isElite,
            aiGenerationCost: this._aiGenerationCost,
            realBookingCost: this._realBookingCost,
            contentPreferences: this._contentPreferences,
            location: this._location,
            gender: this._gender,
            ethnicity: this._ethnicity,
            bodyType: this._bodyType,
            ageRange: this._ageRange,
            createdByUserId: this._createdByUserId,
            isEliteActive: this.isEliteActive(),
            createdAt: this._createdAt,
            updatedAt: this._updatedAt,
        };
    }
}
