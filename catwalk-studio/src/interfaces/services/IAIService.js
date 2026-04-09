/* eslint-disable no-unused-vars */
/**
 * Mock AI Service Interface
 * Defines contract for AI generation services
 */
export class IAIService {
    /**
     * Generate an image based on prompt and settings
     * @param {Object} params - Generation parameters
     * @param {string} params.prompt - Generation prompt
     * @param {string} [params.modelId] - AI model ID
     * @param {string} [params.quality] - Quality setting
     * @param {Object} [params.settings] - Additional settings
     * @returns {Promise<string>} Generated image URL
     */
    async generateImage(_params) {
        throw new Error('IAIService.generateImage() must be implemented');
    }
}
