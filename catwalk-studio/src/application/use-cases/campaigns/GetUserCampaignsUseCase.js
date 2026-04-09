import { UseCase, Result } from '../UseCase.js';
import { CampaignDTO } from '../../dto/CampaignDTO.js';

/**
 * Get User Campaigns Use Case
 * Retrieves all campaigns for a user with optional generation counts
 */
export class GetUserCampaignsUseCase extends UseCase {
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
     * @param {string} input.userId - User ID
     * @param {string} [input.status] - Optional status filter
     * @param {boolean} [input.includeGenerationCount] - Include generation count (default: true)
     * @returns {Promise<Result>} Result with array of campaign DTOs
     */
    async execute(input) {
        try {
            const { userId, status, includeGenerationCount = true } = input;

            if (!userId) {
                return Result.fail('User ID is required');
            }

            // Get campaigns from repository
            const campaigns = await this.campaignRepository.findByUserId(userId, {
                status,
                includeGenerationCount,
            });

            // Convert to DTOs, attaching generation count if available
            const campaignDTOs = campaigns.map(campaign => {
                const dto = CampaignDTO.fromEntity(campaign);
                // Attach extra data from the join query
                if (campaign._generationCount !== undefined) {
                    dto.generationCount = campaign._generationCount;
                }
                return dto;
            });

            return Result.ok(campaignDTOs);
        } catch (error) {
            return Result.fail(error.message || 'Failed to get user campaigns');
        }
    }
}
