import { IAIService } from '../../interfaces/services/IAIService.js';

/**
 * Mock AI Service
 * Simulates AI image generation for development/testing
 * TODO: Replace with real AI service (Replicate, Stability AI, etc.)
 */
export class MockAIService extends IAIService {
    /**
     * Generate a mock image
     * @param {Object} params - Generation parameters
     * @returns {Promise<string>} Mock image URL
     */
    async generateImage(params) {
        const { prompt, quality = 'standard', settings = {} } = params;

        // Simulate API delay
        await this.simulateDelay(2000, 4000);

        // Mock image URLs from placeholder services
        const mockImages = [
            'https://picsum.photos/seed/' + this.getRandomSeed() + '/1024/1024',
            'https://picsum.photos/seed/' + this.getRandomSeed() + '/1024/1536',
            'https://picsum.photos/seed/' + this.getRandomSeed() + '/768/1024',
        ];

        // Select random image
        const imageUrl = mockImages[Math.floor(Math.random() * mockImages.length)];

        console.log('🎨 Mock AI Generation:', {
            prompt,
            quality,
            settings,
            imageUrl
        });

        return imageUrl;
    }

    /**
     * Simulate API delay
     * @param {number} min - Minimum delay in ms
     * @param {number} max - Maximum delay in ms
     * @returns {Promise<void>}
     */
    async simulateDelay(min, max) {
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    /**
     * Get random seed for consistent mock images
     * @returns {string}
     */
    getRandomSeed() {
        return Math.random().toString(36).substring(7);
    }
}
