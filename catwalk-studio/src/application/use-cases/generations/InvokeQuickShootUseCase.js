import { UseCase, Result } from '../UseCase.js';

/**
 * Invoke Quick Shoot Use Case
 * Invokes the generate-quick-shoot edge function
 */
export class InvokeQuickShootUseCase extends UseCase {
    constructor(generationRepository) {
        super();
        this.generationRepository = generationRepository;
    }

    async execute(input) {
        try {
            const result = await this.generationRepository.invokeQuickShoot(input);
            return Result.ok(result);
        } catch (error) {
            return Result.fail(error.message || 'Failed to invoke quick shoot');
        }
    }
}
