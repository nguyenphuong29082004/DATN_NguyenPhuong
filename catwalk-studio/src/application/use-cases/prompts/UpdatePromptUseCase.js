import { UseCase, Result } from '../UseCase.js';
import { PromptDTO } from '../../dto/PromptDTO.js';

/**
 * Update Prompt Use Case
 * Updates an existing prompt owned by the user
 */
export class UpdatePromptUseCase extends UseCase {
    /**
     * @param {import('../../../interfaces/repositories/IPromptRepository').IPromptRepository} promptRepository
     */
    constructor(promptRepository) {
        super();
        this.promptRepository = promptRepository;
    }

    /**
     * Execute the use case
     * @param {Object} input - Update input
     * @param {string} input.promptId - Prompt ID
     * @param {string} input.userId - User ID (for ownership check)
     * @param {string} [input.name] - New name
     * @param {string} [input.promptText] - New prompt text
     * @param {string} [input.description] - New description
     * @param {string} [input.category] - New category
     * @param {boolean} [input.isPublic] - New visibility
     * @param {Array<string>} [input.tags] - New tags
     * @param {Object} [input.metadata] - New metadata
     * @returns {Promise<Result>} Result with updated prompt DTO
     */
    async execute(input) {
        try {
            const { promptId, userId, ...updates } = input;

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
                return Result.fail('You do not have permission to update this prompt');
            }

            // Update details using domain logic
            prompt.updateDetails(updates);

            // Save updated prompt
            await this.promptRepository.save(prompt);

            // Convert to DTO
            const promptDTO = PromptDTO.fromEntity(prompt);

            return Result.ok(promptDTO);
        } catch (error) {
            return Result.fail(error.message || 'Failed to update prompt');
        }
    }
}
