import { UseCase, Result } from '../UseCase.js';
import { getSupabaseClient } from '../../../infrastructure/supabase/supabase.client.js';

/**
 * Delete Campaign Use Case
 * Deletes a campaign, its associated generations, and R2 files
 */
export class DeleteCampaignUseCase extends UseCase {
    /**
     * @param {import('../../../interfaces/repositories/ICampaignRepository').ICampaignRepository} campaignRepository
     * @param {import('../../../interfaces/repositories/IGenerationRepository').IGenerationRepository} generationRepository
     */
    constructor(campaignRepository, generationRepository) {
        super();
        this.campaignRepository = campaignRepository;
        this.generationRepository = generationRepository;
        this.supabase = getSupabaseClient();
    }

    /**
     * Execute the use case
     * @param {Object} input
     * @param {string} input.campaignId - Campaign ID
     * @param {string} input.userId - User ID (for ownership check)
     * @returns {Promise<Result>}
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
                return Result.fail('You do not have permission to delete this campaign');
            }

            // Fetch all generations for this campaign
            const { data: generations, error: genError } = await this.supabase
                .from('generations')
                .select('id, output_url')
                .eq('campaign_id', campaignId);

            if (genError) {
                return Result.fail(`Failed to fetch generations: ${genError.message}`);
            }

            // Collect R2 file paths from generation output_urls
            const filePaths = [];
            for (const gen of (generations || [])) {
                if (gen.output_url) {
                    const path = this.extractR2Path(gen.output_url);
                    if (path) filePaths.push(path);
                }
            }

            // Delete files from R2
            if (filePaths.length > 0) {
                try {
                    const { error } = await this.supabase.functions.invoke('delete-from-r2', {
                        body: { filePaths },
                    });

                    if (error) {
                        console.warn('Failed to delete images from R2:', error);
                    }
                } catch (error) {
                    console.warn('Failed to delete images from R2:', error);
                }
            }

            // Delete all generations for this campaign
            if (generations && generations.length > 0) {
                const { error: deleteGenError } = await this.supabase
                    .from('generations')
                    .delete()
                    .eq('campaign_id', campaignId);

                if (deleteGenError) {
                    console.warn('Failed to delete generations:', deleteGenError);
                }
            }

            // Delete the campaign
            await this.campaignRepository.delete(campaignId);

            return Result.ok({ success: true, deletedGenerations: (generations || []).length });
        } catch (error) {
            return Result.fail(error.message || 'Failed to delete campaign');
        }
    }

    /**
     * Extract R2 file path from public URL
     * @param {string} url - Public URL
     * @returns {string|null}
     */
    extractR2Path(url) {
        try {
            const urlObj = new URL(url);
            let path = urlObj.pathname;
            path = path.replace(/^\//, '');

            const bucketName = 'catwalk-studio';
            if (path.startsWith(`${bucketName}/`)) {
                path = path.substring(bucketName.length + 1);
            }

            return path || null;
        } catch {
            return null;
        }
    }
}
