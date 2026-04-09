import { UseCase, Result } from '../UseCase.js';

/**
 * Start Campaign Use Case
 * Starts a campaign and begins batch generation
 * This would typically trigger background jobs for each generation
 */
export class StartCampaignUseCase extends UseCase {
    /**
     * @param {import('../../../interfaces/repositories/ICampaignRepository').ICampaignRepository} campaignRepository
     */
    constructor(campaignRepository) {
        super();
        this.campaignRepository = campaignRepository;
    }

    /**
     * Execute the use case
     * @param {Object} input - Input parameters
     * @param {string} input.campaignId - Campaign ID
     * @param {string} input.userId - User ID (for ownership check)
     * @returns {Promise<Result>} Result indicating success
     */
    async execute(input) {
        try {
            const { campaignId, userId } = input;

            if (!campaignId) {
                return Result.fail('Campaign ID is required');
            }

            if (!userId) {
                return Result.fail('User ID is required');
            }

            // Get campaign entity
            const campaign = await this.campaignRepository.findById(campaignId);

            if (!campaign) {
                return Result.fail('Campaign not found');
            }

            // Check ownership
            if (!campaign.isOwnedBy(userId)) {
                return Result.fail('You do not have permission to start this campaign');
            }

            // Start campaign using domain logic
            campaign.start();

            // Save updated campaign
            await this.campaignRepository.save(campaign);

            // TODO: Trigger background jobs for batch generation
            // This would normally dispatch jobs to a queue for each generation
            // For now, we just mark it as running

            return Result.ok({
                success: true,
                status: campaign.status,
                message: 'Campaign started successfully'
            });
        } catch (error) {
            return Result.fail(error.message || 'Failed to start campaign');
        }
    }
}
