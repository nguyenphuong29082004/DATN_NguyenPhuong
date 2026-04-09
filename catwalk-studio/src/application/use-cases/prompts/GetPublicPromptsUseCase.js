import { UseCase, Result } from '../UseCase.js';
import { PromptDTO } from '../../dto/PromptDTO.js';

/**
 * Get Public Prompts Use Case
 * Retrieves all public and system prompts
 */
export class GetPublicPromptsUseCase extends UseCase {
    /**
     * @param {import('../../../interfaces/repositories/IPromptRepository').IPromptRepository} promptRepository
     */
    constructor(promptRepository) {
        super();
        this.promptRepository = promptRepository;
    }

    /**
     * Execute the use case
     * Supports both legacy signature `execute()` and
     * paginated signature `execute({ limit, offset })`.
     *
     * @param {Object} [input] - Optional paginated input object
     * @returns {Promise<Result>} Result with prompt DTO array or paginated payload
     */
    async execute(input = null) {
        try {
            const limit = input?.limit;
            const offset = input?.offset ?? 0;
            const queryLimit = typeof limit === 'number' && limit > 0 ? limit + 1 : undefined;

            const prompts = await this.promptRepository.findPublicAndSystem({
                limit: queryLimit,
                offset,
            });
            const promptDTOs = prompts.map(prompt => PromptDTO.fromEntity(prompt));

            if (!queryLimit) {
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
            return Result.fail(error.message || 'Failed to get public prompts');
        }
    }
}
