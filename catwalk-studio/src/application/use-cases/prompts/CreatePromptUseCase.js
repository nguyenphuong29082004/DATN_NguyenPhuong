import { UseCase, Result } from '../UseCase.js';
import { Prompt } from '../../../domain/entities/Prompt.js';
import { PromptDTO } from '../../dto/PromptDTO.js';

/**
 * Create Prompt Use Case
 * Creates a new prompt for a user
 */
export class CreatePromptUseCase extends UseCase {
    /**
     * @param {import('../../../interfaces/repositories/IPromptRepository').IPromptRepository} promptRepository
     */
    constructor(promptRepository) {
        super();
        this.promptRepository = promptRepository;
    }

    /**
     * Execute the use case
     * @param {Object} input - Prompt creation input
     * @param {string} input.userId - Owner user ID
     * @param {string} input.name - Prompt name
     * @param {string} input.promptText - The prompt text/template
     * @param {string} [input.description] - Prompt description
     * @param {string} [input.category] - Prompt category
     * @param {boolean} [input.isPublic] - Visibility
     * @param {Array<string>} [input.tags] - Tags
     * @param {Object} [input.metadata] - Metadata
     * @returns {Promise<Result>} Result with created prompt DTO
     */
    async execute(input) {
        try {
            const { userId, name, promptText, negativePrompt, parametersJson, description, category, isPublic, tags, metadata } = input;

            // Validate input
            if (!userId) {
                return Result.fail('User ID is required');
            }

            if (!name || name.trim() === '') {
                return Result.fail('Prompt name is required');
            }

            if (!promptText || promptText.trim() === '') {
                return Result.fail('Prompt text is required');
            }

            // Create prompt entity
            const promptData = {
                userId,
                name: name.trim(),
                promptText: promptText.trim(),
                negativePrompt: negativePrompt || null,
                parametersJson: parametersJson || {},
                description: description || '',
                category: category || null,
                isPublic: isPublic || false,
                tags: tags || [],
                metadata: metadata || {},
            };

            const prompt = Prompt.create(promptData);

            // Save prompt via repository
            const savedPrompt = await this.promptRepository.create(prompt);

            // Convert to DTO
            const promptDTO = PromptDTO.fromEntity(savedPrompt);

            return Result.ok(promptDTO);
        } catch (error) {
            return Result.fail(error.message || 'Failed to create prompt');
        }
    }
}
