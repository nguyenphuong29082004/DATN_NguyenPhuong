import { UseCase, Result } from '../UseCase.js';
import { Campaign } from '../../../domain/entities/Campaign.js';
import { CampaignDTO } from '../../dto/CampaignDTO.js';

/**
 * Create Campaign Use Case
 * Creates a new campaign (folder) in active status
 * 
 * A campaign is a folder for organizing shoots/generations.
 * Only requires name; details are optional.
 */
export class CreateCampaignUseCase extends UseCase {
    /**
     * @param {import('../../../interfaces/repositories/ICampaignRepository').ICampaignRepository} campaignRepository
     */
    constructor(campaignRepository) {
        super();
        this.campaignRepository = campaignRepository;
    }

    /**
     * Execute the use case
     * @param {Object} input - Campaign creation input
     * @param {string} input.userId - User ID
     * @param {string} input.name - Campaign name
     * @param {string} [input.details] - Campaign description (optional)
     * @param {string} [input.brandGuidelinesUrl] - Brand guidelines URL (optional)
     * @returns {Promise<Result>} Result with created campaign DTO
     */
    async execute(input) {
        try {
            const { userId, name, details, brandGuidelinesUrl } = input;

            // Validate input
            if (!userId) {
                return Result.fail('User ID is required');
            }

            if (!name || name.trim() === '') {
                return Result.fail('Campaign name is required');
            }

            // Create campaign entity (active status)
            const campaign = Campaign.create({
                userId,
                name: name.trim(),
                details: details?.trim() || null,
                brandGuidelinesUrl: brandGuidelinesUrl || null,
            });

            // Save campaign
            const savedCampaign = await this.campaignRepository.create(campaign);

            // Convert to DTO
            const campaignDTO = CampaignDTO.fromEntity(savedCampaign);

            return Result.ok(campaignDTO);
        } catch (error) {
            return Result.fail(error.message || 'Failed to create campaign');
        }
    }
}
