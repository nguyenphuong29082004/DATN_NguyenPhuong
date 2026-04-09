import { UseCase, Result } from '../UseCase.js';
import { CampaignDTO } from '../../dto/CampaignDTO.js';

/**
 * Archive Campaign Use Case
 * Toggles a campaign between active and archived status
 */
export class ArchiveCampaignUseCase extends UseCase {
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
     * @returns {Promise<Result>} Result with updated campaign DTO
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
                return Result.fail('You do not have permission to modify this campaign');
            }

            // Toggle status using domain logic
            if (campaign.isActive()) {
                campaign.archive();
            } else {
                campaign.reactivate();
            }

            // Save updated campaign
            await this.campaignRepository.save(campaign);

            const campaignDTO = CampaignDTO.fromEntity(campaign);

            return Result.ok(campaignDTO);
        } catch (error) {
            return Result.fail(error.message || 'Failed to archive campaign');
        }
    }
}
