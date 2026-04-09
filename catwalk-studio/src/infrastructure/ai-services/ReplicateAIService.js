import { IAIService } from '../../interfaces/services/IAIService.js';

/**
 * Replicate AI Service Implementation
 * Real implementation using Replicate API
 */
export class ReplicateAIService extends IAIService {
    constructor() {
        super();
        this.apiToken = import.meta.env.VITE_REPLICATE_API_TOKEN;
        // Default model: Flux.1 Dev (can be overridden in params)
        this.defaultModel = "black-forest-labs/flux-dev";
    }

    /**
     * Generate an image using Replicate
     * @param {Object} params - Generation parameters
     * @returns {Promise<string>} Generated image URL
     */
    async generateImage(params) {
        const { prompt, modelId, settings = {} } = params;
        const model = modelId || this.defaultModel;

        console.log('🚀 Starting Replicate Generation:', { model, prompt });

        try {
            // 1. Create Prediction
            const response = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${this.apiToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    input: {
                        prompt: prompt,
                        aspect_ratio: settings.aspect_ratio || "1:1",
                        output_format: "webp",
                        output_quality: 90,
                        safety_tolerance: 2,
                        ...settings
                    }
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to create prediction');
            }

            let prediction = await response.json();
            const predictionId = prediction.id;

            // 2. Poll for result
            console.log(`⏳ Prediction created (${predictionId}), polling for results...`);
            
            while (prediction.status !== 'succeeded' && prediction.status !== 'failed' && prediction.status !== 'canceled') {
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
                
                const pollResp = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
                    headers: {
                        'Authorization': `Token ${this.apiToken}`,
                    },
                });
                prediction = await pollResp.json();
                console.log(`   Status: ${prediction.status}`);
            }

            if (prediction.status === 'succeeded') {
                // Replicate returns an array for some models, single string for others
                const imageUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
                console.log('✅ Image generated:', imageUrl);
                return imageUrl;
            } else {
                throw new Error(`Replicate failed with status: ${prediction.status}. ${prediction.error || ''}`);
            }

        } catch (error) {
            console.error('❌ ReplicateAIService Error:', error);
            throw error;
        }
    }
}
