import { Campaign } from '../../../domain/entities/Campaign.js';

/**
 * Campaign Mapper
 * Maps between database rows and Campaign entities
 * 
 * DB Schema (campaigns table):
 *   campaign_id UUID PK
 *   user_id UUID NOT NULL
 *   name TEXT NOT NULL
 *   details TEXT
 *   brand_guidelines_url TEXT
 *   metadata JSONB DEFAULT '{}'
 *   status TEXT DEFAULT 'active' CHECK (active, archived)
 *   created_at TIMESTAMPTZ
 *   updated_at TIMESTAMPTZ
 */
export class CampaignMapper {
    /**
     * Convert database row to Campaign entity
     * @param {Object} row - Database row from campaigns table
     * @returns {Campaign} Campaign entity
     */
    static toDomain(row) {
        if (!row) return null;

        const props = {
            userId: row.user_id,
            name: row.name,
            details: row.details || null,
            brandGuidelinesUrl: row.brand_guidelines_url || null,
            metadata: row.metadata || {},
            status: row.status || 'active',
            totalCost: 0,
            generationIds: [],
            createdAt: row.created_at ? new Date(row.created_at) : new Date(),
            updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
        };

        return Campaign.create(props, row.campaign_id);
    }

    /**
     * Convert database row with generation count to Campaign entity
     * Used when querying with generated_content(count) join
     * @param {Object} row - Database row with generated_content count
     * @returns {Campaign} Campaign entity
     */
    static toDomainWithCount(row) {
        if (!row) return null;

        const campaign = CampaignMapper.toDomain(row);

        // Attach generation count from the join query
        // generated_content returns [{count: N}] from Supabase
        const countData = row.generated_content;
        if (Array.isArray(countData) && countData.length > 0) {
            campaign._generationCount = countData[0]?.count || 0;
        } else {
            campaign._generationCount = 0;
        }

        return campaign;
    }

    /**
     * Convert Campaign entity to database row
     * @param {Campaign} campaign - Campaign entity
     * @returns {Object} Database row for campaigns table
     */
    static toDatabase(campaign) {
        const row = {
            user_id: campaign.userId,
            name: campaign.name,
            details: campaign.details,
            brand_guidelines_url: campaign.brandGuidelinesUrl,
            metadata: campaign.metadata || {},
            status: campaign.status,
            updated_at: new Date().toISOString(),
        };

        // Only include campaign_id if it exists (for updates)
        if (campaign.id) {
            row.campaign_id = campaign.id;
        }

        return row;
    }
}
