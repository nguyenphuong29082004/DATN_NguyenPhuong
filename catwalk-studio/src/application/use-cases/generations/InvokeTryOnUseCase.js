import { UseCase, Result } from '../UseCase.js';

/**
 * Invoke Try-On Use Case
 * Invokes the generate-try-on edge function
 */
export class InvokeTryOnUseCase extends UseCase {
    constructor(generationRepository) {
        super();
        this.generationRepository = generationRepository;
    }

    async execute(input) {
        try {
            const result = await this.generationRepository.invokeTryOn(input);
            return Result.ok(result);
        } catch (error) {
            return Result.fail(error.message || 'Failed to invoke try-on');
        }
    }
}
