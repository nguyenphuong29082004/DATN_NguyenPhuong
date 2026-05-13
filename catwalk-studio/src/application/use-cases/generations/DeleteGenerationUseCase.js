import { UseCase, Result } from '../UseCase.js';
import { getSupabaseClient } from '../../../infrastructure/supabase/supabase.client.js';

/**
 * Delete Generation Use Case
 * Deletes a user's generation and its associated image from R2
 */
export class DeleteGenerationUseCase extends UseCase {
    /**
     * @param {import('../../../interfaces/repositories/IGenerationRepository').IGenerationRepository} generationRepository
     * @param {import('../../../interfaces/repositories/IAIModelRepository').IAIModelRepository} aiModelRepository
     */
    constructor(generationRepository, aiModelRepository) {
        super();
        this.generationRepository = generationRepository;
        this.aiModelRepository = aiModelRepository;
        this.supabase = getSupabaseClient();
    }

    /**
     * Execute the use case
     * @param {Object} input - Input parameters
     * @param {string} input.generationId - Generation ID
     * @param {string} input.userId - User ID (for ownership check)
     * @returns {Promise<Result>} Result indicating success
     */
    async execute(input) {
        try {
            const { generationId, userId } = input;

            // Validate input
            if (!generationId) {
                return Result.fail('Generation ID is required');
            }

            if (!userId) {
                return Result.fail('User ID is required');
            }

            // Get generation entity
            const generation = await this.generationRepository.findById(generationId);

            if (!generation) {
                return Result.fail('Generation not found');
            }

            // Check ownership using domain logic
            if (!generation.isOwnedBy(userId)) {
                return Result.fail('You do not have permission to delete this generation');
            }

            // Delete image from R2
            if (generation.imageUrl) {
                const filePath = this.extractR2Path(generation.imageUrl);
                if (filePath) {
                    try {
                        const { error } = await this.supabase.functions.invoke('delete-from-r2', {
                            body: { filePaths: [filePath] },
                        });

                        if (error) {
                            console.warn('Failed to delete image from R2:', error);
                        }
                    } catch (error) {
                        console.warn('Failed to delete image from R2:', error);
                    }
                }
            }

            // Delete generation from DB
            await this.generationRepository.delete(generationId);

            // cascade delete AI Model if exists
            if (generation.aiModelId && this.aiModelRepository) {
                try {
                    await this.aiModelRepository.delete(generation.aiModelId);
                } catch (cascadeError) {
                    console.warn('Failed to delete associated AI model character:', cascadeError);
                }
            }

            return Result.ok({ success: true });
        } catch (error) {
            return Result.fail(error.message || 'Failed to delete generation');
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
