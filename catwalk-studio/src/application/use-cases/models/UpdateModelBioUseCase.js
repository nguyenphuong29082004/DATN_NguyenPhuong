import { UseCase, Result } from '../UseCase.js';

/**
 * Update Model Bio Use Case
 * Updates the description/bio of a model profile for the owner.
 */
export class UpdateModelBioUseCase extends UseCase {
    constructor(supabase) {
        super();
        this.supabase = supabase;
    }

    async execute(input) {
        try {
            const { modelId, username, bio } = input;

            if (!modelId) {
                return Result.fail('Model ID is required');
            }

            if (!username) {
                return Result.fail('Username is required');
            }

            if (!bio || !bio.trim()) {
                return Result.fail('Bio is required');
            }

            const { data, error } = await this.supabase.functions.invoke('update-model-bio', {
                body: {
                    modelId,
                    bio: bio.trim(),
                },
            });

            if (error || !data?.success) {
                return Result.fail(error?.message || data?.error || 'Failed to update bio');
            }

            return Result.ok(data);
        } catch (error) {
            return Result.fail(error.message || 'Failed to update bio');
        }
    }
}
