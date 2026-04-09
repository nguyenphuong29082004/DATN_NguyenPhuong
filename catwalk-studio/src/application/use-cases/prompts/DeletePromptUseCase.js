import { UseCase, Result } from '../UseCase.js';

/**
 * Delete Prompt Use Case
 * Deletes a prompt owned by the user
 */
export class DeletePromptUseCase extends UseCase {
    /**
     * @param {import('../../../interfaces/repositories/IPromptRepository').IPromptRepository} promptRepository
     */
    constructor(promptRepository) {
        super();
        this.promptRepository = promptRepository;
    }

    /**
     * Execute the use case
     * @param {Object} input - Delete input
     * @param {string} input.promptId - Prompt ID
     * @param {string} input.userId - User ID (for ownership check)
     * @returns {Promise<Result>} Result indicating success
     */
    async execute(input) {
        try {
            const { promptId, userId } = input;

            // Validate input
            if (!promptId) {
                return Result.fail('Prompt ID is required');
            }

            if (!userId) {
                return Result.fail('User ID is required');
            }

            // Get prompt entity
            const prompt = await this.promptRepository.findById(promptId);

            if (!prompt) {
                return Result.fail('Prompt not found');
            }

            // Check ownership
            if (prompt.userId !== userId) {
                return Result.fail('You do not have permission to delete this prompt');
            }

            // Delete prompt
            await this.promptRepository.delete(promptId);

            return Result.ok({ success: true });
        } catch (error) {
            return Result.fail(error.message || 'Failed to delete prompt');
        }
    }
}
