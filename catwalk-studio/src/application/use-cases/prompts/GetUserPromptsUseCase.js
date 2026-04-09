import { UseCase, Result } from '../UseCase.js';
import { PromptDTO } from '../../dto/PromptDTO.js';

/**
 * Get User Prompts Use Case
 * Retrieves all prompts owned by a specific user
 */
export class GetUserPromptsUseCase extends UseCase {
    /**
     * @param {import('../../../interfaces/repositories/IPromptRepository').IPromptRepository} promptRepository
     */
    constructor(promptRepository) {
        super();
        this.promptRepository = promptRepository;
    }

    /**
     * Execute the use case
     * Supports both legacy signature `execute(userId)` and
     * paginated signature `execute({ userId, limit, offset })`.
     *
     * @param {string|Object} input - User ID or paginated input object
     * @returns {Promise<Result>} Result with prompt DTO array or paginated payload
     */
    async execute(input) {
        try {
            const isLegacySignature = typeof input === 'string';
            const userId = isLegacySignature ? input : input?.userId;
            const limit = isLegacySignature ? null : input?.limit;
            const offset = isLegacySignature ? 0 : (input?.offset ?? 0);

            if (!userId) {
                return Result.fail('User ID is required');
            }

            // Get prompts from repository
            const queryLimit = typeof limit === 'number' && limit > 0 ? limit + 1 : undefined;
            const prompts = await this.promptRepository.findByUserId(userId, {
                limit: queryLimit,
                offset,
            });

            // Convert to DTOs
            const promptDTOs = prompts.map(prompt => PromptDTO.fromEntity(prompt));

            if (isLegacySignature || !queryLimit) {
                return Result.ok(promptDTOs);
            }

            const hasMore = promptDTOs.length > limit;
            const items = hasMore ? promptDTOs.slice(0, limit) : promptDTOs;

            return Result.ok({
                items,
                hasMore,
                nextOffset: offset + items.length,
            });

        } catch (error) {
            return Result.fail(error.message || 'Failed to get user prompts');
        }
    }
}
