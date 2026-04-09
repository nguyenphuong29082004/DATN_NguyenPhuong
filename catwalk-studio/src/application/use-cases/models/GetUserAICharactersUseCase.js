import { UseCase, Result } from '../UseCase.js';

/**
 * Get User AI Characters Use Case
 * Gets user's generated AI model characters
 */
export class GetUserAICharactersUseCase extends UseCase {
    constructor(aiModelRepository) {
        super();
        this.aiModelRepository = aiModelRepository;
    }

    async execute(input) {
        try {
            const { userId } = input;
            if (!userId) return Result.fail('User ID is required');

            const characters = await this.aiModelRepository.findUserCharacters(userId);
            return Result.ok(characters);
        } catch (error) {
            return Result.fail(error.message || 'Failed to get AI characters');
        }
    }
}
