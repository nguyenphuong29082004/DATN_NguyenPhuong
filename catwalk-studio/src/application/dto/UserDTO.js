/**
 * User Data Transfer Objects (DTOs)
 * Used for transferring data between layers
 */

/**
 * User Profile DTO
 * Used for returning user data to the UI
 */
export class UserProfileDTO {
    constructor(data) {
        this.id = data.id;
        this.email = data.email;
        this.displayName = data.displayName;
        this.avatarUrl = data.avatarUrl;
        this.creditBalance = data.creditBalance;
        this.subscriptionTier = data.subscriptionTier;
        this.isModel = data.isModel;
        this.isElite = data.isElite;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    static fromEntity(user) {
        return new UserProfileDTO({
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            creditBalance: user.creditBalance,
            subscriptionTier: user.subscriptionTier,
            isModel: user.isModel,
            isElite: user.isElite,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        });
    }
}

/**
 * Update User Profile Input DTO
 */
export class UpdateUserProfileDTO {
    constructor(data) {
        this.userId = data.userId;
        this.displayName = data.displayName;
        this.avatarUrl = data.avatarUrl;
    }
}

/**
 * Register User Input DTO
 */
export class RegisterUserDTO {
    constructor(data) {
        this.email = data.email;
        this.password = data.password;
        this.isAnonymous = data.isAnonymous || false;
    }
}
