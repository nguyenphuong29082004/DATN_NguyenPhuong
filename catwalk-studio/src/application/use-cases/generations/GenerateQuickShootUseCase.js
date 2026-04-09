import { UseCase, Result } from '../UseCase.js';
import { Generation } from '../../../domain/entities/Generation.js';
import { GenerationDTO } from '../../dto/GenerationDTO.js';

/**
 * Generate Quick Shoot Use Case
 * Orchestrates the entire generation flow:
 * 1. Validate input
 * 2. Check and deduct credits (via DeductCreditsUseCase)
 * 3. Create Generation entity (pending)
 * 4. Call AI service to generate image
 * 5. Update Generation (completed/failed)
 * 6. Increment model usage count
 * 7. Save and return result
 * 
 * This is the CORE use case tying together User, Credits, Models, and Generations
 */
export class GenerateQuickShootUseCase extends UseCase {
    /**
     * @param {import('../../../interfaces/repositories/IGenerationRepository').IGenerationRepository} generationRepository
     * @param {import('../credits/DeductCreditsUseCase').DeductCreditsUseCase} deductCreditsUseCase
     * @param {import('../../../interfaces/repositories/IAIModelRepository').IAIModelRepository} aiModelRepository
     * @param {import('../../../interfaces/services/IAIService').IAIService} aiService
     */
    constructor(generationRepository, deductCreditsUseCase, aiModelRepository, aiService) {
        super();
        this.generationRepository = generationRepository;
        this.deductCreditsUseCase = deductCreditsUseCase;
        this.aiModelRepository = aiModelRepository;
        this.aiService = aiService;
    }

    /**
     * Execute the use case
     * @param {Object} input - Generation input
     * @param {string} input.userId - User ID
     * @param {string} [input.modelId] - AI Model ID
     * @param {string} input.prompt - Generation prompt
     * @param {string} [input.quality] - Quality ('standard', 'hd')
     * @param {Object} [input.settings] - Additional settings
     * @returns {Promise<Result>} Result with generation DTO
     */
    async execute(input) {
        try {
            const { userId, modelId, prompt, quality = 'standard', settings = {} } = input;

            // 1. Validate input
            if (!userId) {
                return Result.fail('User ID is required');
            }

            if (!prompt || prompt.trim() === '') {
                return Result.fail('Prompt is required');
            }

            // 2. Create Generation entity (pending state)
            const generation = Generation.create({
                userId,
                modelId,
                prompt: prompt.trim(),
                quality,
                settings,
                status: 'pending',
            });

            // Get credit cost from domain logic
            const creditCost = generation.getCreditCost();

            // 3. Deduct credits FIRST (fail fast if insufficient)
            const deductResult = await this.deductCreditsUseCase.execute({
                userId,
                amount: creditCost,
                reason: `Quick Shoot Generation (${quality})`,
                metadata: {
                    generationId: generation.id,
                    prompt: prompt.substring(0, 100), // Truncate for metadata
                    quality,
                },
            });

            if (deductResult.isFailure()) {
                return Result.fail(deductResult.getError());
            }

            // 4. Save pending generation to database
            const savedGeneration = await this.generationRepository.create(generation);

            // 5. Generate image via AI service (async operation)
            let imageUrl;
            try {
                imageUrl = await this.aiService.generateImage({
                    prompt,
                    modelId,
                    quality,
                    settings,
                });

                // Mark as completed
                savedGeneration.markAsCompleted(imageUrl);
            } catch (error) {
                console.error('AI generation failed:', error);
                // Mark as failed
                savedGeneration.markAsFailed(error.message || 'Generation failed');
            }

            // 6. Update generation status
            await this.generationRepository.save(savedGeneration);

            // 7. If using a model, increment its usage count
            if (modelId && savedGeneration.isCompleted()) {
                try {
                    const model = await this.aiModelRepository.findById(modelId);
                    if (model) {
                        model.incrementUsageCount();
                        await this.aiModelRepository.save(model);
                    }
                } catch (error) {
                    // Non-critical error, just log it
                    console.error('Failed to increment model usage count:', error);
                }
            }

            // 8. Convert to DTO and return
            const generationDTO = GenerationDTO.fromEntity(savedGeneration);

            return Result.ok({
                generation: generationDTO,
                creditsDeducted: creditCost,
                newBalance: deductResult.getValue().newBalance,
            });
        } catch (error) {
            console.error('GenerateQuickShootUseCase error:', error);
            return Result.fail(error.message || 'Failed to generate image');
        }
    }
}
