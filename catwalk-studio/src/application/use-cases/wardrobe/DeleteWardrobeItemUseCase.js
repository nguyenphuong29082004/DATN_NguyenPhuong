import { UseCase, Result } from '../UseCase.js';
import { getSupabaseClient } from '../../../infrastructure/supabase/supabase.client.js';

/**
 * Delete Wardrobe Item Use Case
 * Deletes a wardrobe item owned by the user and its associated images from R2
 */
export class DeleteWardrobeItemUseCase extends UseCase {
    /**
     * @param {import('../../../interfaces/repositories/IWardrobeRepository').IWardrobeRepository} wardrobeRepository
     */
    constructor(wardrobeRepository) {
        super();
        this.wardrobeRepository = wardrobeRepository;
        this.supabase = getSupabaseClient();
    }

    /**
     * Execute the use case
     * @param {Object} input - Delete input
     * @param {string} input.itemId - Wardrobe item ID
     * @param {string} input.userId - User ID (for ownership check)
     * @returns {Promise<Result>} Result indicating success
     */
    async execute(input) {
        try {
            const { itemId, userId } = input;

            // Validate input
            if (!itemId) {
                return Result.fail('Item ID is required');
            }

            if (!userId) {
                return Result.fail('User ID is required');
            }

            // Get wardrobe item entity
            const wardrobeItem = await this.wardrobeRepository.findById(itemId);

            if (!wardrobeItem) {
                return Result.fail('Wardrobe item not found');
            }

            // Check ownership
            if (wardrobeItem.userId !== userId) {
                return Result.fail('You do not have permission to delete this wardrobe item');
            }

            // Collect R2 file paths to delete
            const filePaths = [];
            if (wardrobeItem.thumbnailUrl) {
                const path = this.extractR2Path(wardrobeItem.thumbnailUrl);
                if (path) filePaths.push(path);
            }
            if (wardrobeItem.highResImageUrl && wardrobeItem.highResImageUrl !== wardrobeItem.thumbnailUrl) {
                const path = this.extractR2Path(wardrobeItem.highResImageUrl);
                if (path) filePaths.push(path);
            }

            // Delete images from R2
            if (filePaths.length > 0) {
                try {
                    const { error } = await this.supabase.functions.invoke('delete-from-r2', {
                        body: { filePaths },
                    });

                    if (error) {
                        console.warn('Failed to delete images from R2:', error);
                        // Continue with DB deletion even if R2 delete fails
                    }
                } catch (error) {
                    console.warn('Failed to delete images from R2:', error);
                    // Continue with DB deletion even if R2 delete fails
                }
            }

            // Delete wardrobe item from database
            await this.wardrobeRepository.delete(itemId);

            return Result.ok({ success: true });
        } catch (error) {
            return Result.fail(error.message || 'Failed to delete wardrobe item');
        }
    }

    /**
     * Extract R2 file path from public URL
     * Handles URLs like:
     *   https://pub-xxx.r2.dev/wardrobe_items/userId/filename.webp
     *   https://accountId.r2.cloudflarestorage.com/studio/wardrobe_items/userId/filename.webp
     * 
     * @param {string} url - Public URL
     * @returns {string|null} R2 file path (e.g., "wardrobe_items/userId/filename.webp")
     */
    extractR2Path(url) {
        try {
            const urlObj = new URL(url);
            let path = urlObj.pathname;

            // Remove leading slash
            path = path.replace(/^\//, '');

            // If path starts with bucket name (e.g., "studio/"), strip it
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
