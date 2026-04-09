/**
 * Campaign Data Transfer Objects (DTOs)
 */

/**
 * Campaign DTO - for returning campaign data to presentation layer
 */
export class CampaignDTO {
    constructor(data) {
        this.id = data.id;
        this.userId = data.userId;
        this.name = data.name;
        this.details = data.details;
        this.brandGuidelinesUrl = data.brandGuidelinesUrl;
        this.status = data.status;
        this.metadata = data.metadata;
        this.totalCost = data.totalCost;
        this.generationIds = data.generationIds;
        this.generationCount = data.generationCount;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    static fromEntity(campaign) {
        return new CampaignDTO({
            id: campaign.id,
            userId: campaign.userId,
            name: campaign.name,
            details: campaign.details,
            brandGuidelinesUrl: campaign.brandGuidelinesUrl,
            status: campaign.status,
            metadata: campaign.metadata,
            totalCost: campaign.totalCost,
            generationIds: campaign.generationIds,
            generationCount: campaign.generationCount,
            createdAt: campaign.createdAt,
            updatedAt: campaign.updatedAt,
        });
    }
}

/**
 * Create Campaign Input DTO
 */
export class CreateCampaignDTO {
    constructor(data) {
        this.userId = data.userId;
        this.name = data.name;
        this.details = data.details || null;
        this.brandGuidelinesUrl = data.brandGuidelinesUrl || null;
    }
}
