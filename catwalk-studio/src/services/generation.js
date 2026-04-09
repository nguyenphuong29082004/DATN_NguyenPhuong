/**
 * Generation Service
 * Handles AI image generation with credit deduction and history saving
 */
import { getSupabaseClient } from '../lib/supabase';

const supabase = getSupabaseClient();

const REPLICATE_API_TOKEN = import.meta.env.VITE_REPLICATE_API_TOKEN;
const DEFAULT_MODEL = 'black-forest-labs/flux-dev';

// Credit costs for different generation types
export const GENERATION_COSTS = {
    quick_shoot: 5,
    designer_item: 3,
    ai_model: 15,
    campaign_per_model: 5
};

/**
 * Generate a fashion photo using AI
 * @param {Object} params - Generation parameters
 * @param {string} params.prompt - Main prompt text
 * @param {string} params.negativePrompt - Things to avoid
 * @param {string} params.modelId - Selected AI model ID
 * @param {string[]} params.wardrobeItemIds - Selected wardrobe item IDs
 * @param {number} params.width - Output width
 * @param {number} params.height - Output height
 * @param {string} params.seed - Random seed (optional)
 * @param {string} params.userId - Current user ID
 * @returns {Promise<{success: boolean, image?: string, error?: string, generationId?: string}>}
 */
export const generateQuickShoot = async (params) => {
    const { prompt, negativePrompt, modelId, wardrobeItemIds, width, height, seed, userId } = params;

    // 1. Check user has enough credits
    const creditCheck = await checkCredits(userId, GENERATION_COSTS.quick_shoot);
    if (!creditCheck.hasEnough) {
        return {
            success: false,
            error: `Không đủ credits. Cần ${GENERATION_COSTS.quick_shoot}, hiện có ${creditCheck.balance}`
        };
    }

    // 2. Deduct credits before generation
    const deductResult = await deductCredits(userId, GENERATION_COSTS.quick_shoot, 'quick_shoot_generation');
    if (!deductResult.success) {
        return { success: false, error: 'Không thể trừ credits: ' + deductResult.error };
    }

    try {
        // 3. Call AI generation API
        const startTime = Date.now();
        let generatedImage;

        if (REPLICATE_API_TOKEN) {
            // Real Replicate API
            generatedImage = await generateWithReplicate({
                prompt,
                negativePrompt,
                width,
                height,
                seed
            });
        } else {
            // Fallback to mock for development
            console.warn('⚠️ No REPLICATE_API_TOKEN — using mock generation');
            generatedImage = await mockGenerateImage({ prompt, width, height });
        }

        const durationMs = Date.now() - startTime;

        // 4. Save to generations table with generation metadata (SRS: log duration, price)
        const { data: generation, error: saveError } = await supabase
            .from('generations')
            .insert({
                user_id: userId,
                type: 'quick_shoot',
                prompt: prompt,
                negative_prompt: negativePrompt,
                output_url: generatedImage,
                model_used: modelId,
                wardrobe_items: wardrobeItemIds,
                generation_params: { width, height, seed },
                credit_cost: GENERATION_COSTS.quick_shoot,
                is_public: false,
                duration_ms: durationMs,
            })
            .select()
            .single();

        if (saveError) {
            console.warn('Failed to save generation:', saveError);
        }

        return {
            success: true,
            image: generatedImage,
            generationId: generation?.id,
            durationMs,
        };

    } catch (error) {
        // Refund credits on failure
        await addCredits(userId, GENERATION_COSTS.quick_shoot, 'refund_failed_generation');
        return { success: false, error: 'Generation failed: ' + error.message };
    }
};

/**
 * Check if user has enough credits
 */
export const checkCredits = async (userId, required) => {
    try {
        const { data: profile, error } = await supabase
            .from('users')
            .select('credits_balance')
            .eq('user_id', userId)
            .single();

        if (error || !profile) {
            return { hasEnough: false, balance: 0 };
        }

        return {
            hasEnough: profile.credits_balance >= required,
            balance: profile.credits_balance
        };
    } catch {
        return { hasEnough: false, balance: 0 };
    }
};

/**
 * Deduct credits from user account (server-side atomic operation)
 * Uses Postgres SECURITY DEFINER function to prevent client-side manipulation
 */
export const deductCredits = async (userId, amount, reason) => {
    try {
        const { data, error } = await supabase.rpc('deduct_credits', {
            p_amount: amount,
            p_reason: reason,
            p_metadata: {}
        });

        if (error) {
            return { success: false, error: error.message };
        }

        if (!data?.success) {
            return { success: false, error: data?.error || 'Failed to deduct credits' };
        }

        return { success: true, newBalance: data.new_balance };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

/**
 * Add credits to user account (server-side atomic operation)
 */
export const addCredits = async (userId, amount, reason) => {
    try {
        const { data, error } = await supabase.rpc('add_credits_secure', {
            p_amount: amount,
            p_reason: reason,
            p_metadata: {}
        });

        if (error) {
            return { success: false, error: error.message };
        }

        if (!data?.success) {
            return { success: false, error: data?.error || 'Failed to add credits' };
        }

        return { success: true, newBalance: data.new_balance };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

/**
 * Generate image using Replicate API
 */
const generateWithReplicate = async (params) => {
    const { prompt, width, height } = params;

    // 1. Create a prediction
    const response = await fetch(`https://api.replicate.com/v1/models/${DEFAULT_MODEL}/predictions`, {
        method: 'POST',
        headers: {
            'Authorization': `Token ${REPLICATE_API_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            input: {
                prompt: prompt,
                aspect_ratio: width && height ? `${width}:${height}` : '3:4',
                output_format: 'webp',
                output_quality: 90,
                safety_tolerance: 2,
            }
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create Replicate prediction');
    }

    let prediction = await response.json();

    // 2. Poll for result
    while (prediction.status !== 'succeeded' && prediction.status !== 'failed' && prediction.status !== 'canceled') {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const pollResp = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
            headers: { 'Authorization': `Token ${REPLICATE_API_TOKEN}` },
        });
        prediction = await pollResp.json();
    }

    if (prediction.status === 'succeeded') {
        return Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
    } else {
        throw new Error(`Generation failed: ${prediction.error || prediction.status}`);
    }
};

/**
 * Mock AI image generation (fallback when no API token)
 */
const mockGenerateImage = async () => {
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));

    const fashionImages = [
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1000&fit=crop',
        'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&h=1000&fit=crop',
        'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=1000&fit=crop',
        'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&h=1000&fit=crop',
        'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=800&h=1000&fit=crop',
    ];

    return fashionImages[Math.floor(Math.random() * fashionImages.length)];
};

/**
 * Get user's generation history
 */
export const getGenerationHistory = async (userId, limit = 20) => {
    const { data, error } = await supabase
        .from('generations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Failed to fetch history:', error);
        return [];
    }

    return data || [];
};

/**
 * Update generation to public (add to gallery)
 */
export const addToGallery = async (generationId, userId) => {
    const { error } = await supabase
        .from('generations')
        .update({ is_public: true })
        .eq('id', generationId)
        .eq('user_id', userId);

    return { success: !error, error: error?.message };
};

/**
 * Fetch user's AI models for Quick Shoot
 */
export const fetchUserModels = async (userId) => {
    // First try to get user's own models
    const { data: userModels, error: _userError } = await supabase
        .from('ai_models')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    // Then get public/elite models
    const { data: publicModels, error: _publicError } = await supabase
        .from('ai_models')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(20);

    // Combine and deduplicate
    const allModels = [...(userModels || []), ...(publicModels || [])];
    const uniqueModels = allModels.filter((model, index, self) =>
        index === self.findIndex((m) => m.id === model.id)
    );

    // If no models found, return mock models for demo
    if (uniqueModels.length === 0) {
        return getMockModels();
    }

    return uniqueModels;
};

/**
 * Fetch user's wardrobe items from Designer
 */
export const fetchWardrobeItems = async (userId) => {
    const { data, error } = await supabase
        .from('designer_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    // If no items found, return mock items for demo
    if (error || !data || data.length === 0) {
        return getMockWardrobeItems();
    }

    return data;
};

/**
 * Mock models for development/demo
 */
const getMockModels = () => [
    { id: 'mock-1', name: 'Elena Vance', badge: 'Elite', style: 'Minimalist', price: 50, image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=400&fit=crop' },
    { id: 'mock-2', name: 'Julian Rossi', badge: 'Pro', style: 'Avant-Garde', price: 40, image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop' },
    { id: 'mock-3', name: 'Sasha K.', badge: 'Elite', style: 'Commercial', price: 60, image_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=400&fit=crop' },
    { id: 'mock-4', name: 'Liam Chen', badge: 'Rising', style: 'Runway', price: 35, image_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=400&fit=crop' },
    { id: 'mock-5', name: 'Maya Dubois', badge: 'Elite', style: 'Editorial', price: 55, image_url: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&h=400&fit=crop' },
    { id: 'mock-6', name: 'Anders Jensen', badge: 'Pro', style: 'Streetwear', price: 45, image_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=400&fit=crop' },
];

/**
 * Mock wardrobe items for development/demo
 */
const getMockWardrobeItems = () => [
    { id: 'mock-w1', name: 'Classic Blazer', category: 'Outerwear', image_url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=200&h=250&fit=crop' },
    { id: 'mock-w2', name: 'Silk Dress', category: 'Dresses', image_url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=200&h=250&fit=crop' },
    { id: 'mock-w3', name: 'Denim Jacket', category: 'Outerwear', image_url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=200&h=250&fit=crop' },
    { id: 'mock-w4', name: 'Evening Gown', category: 'Dresses', image_url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=200&h=250&fit=crop' },
    { id: 'mock-w5', name: 'Leather Pants', category: 'Bottoms', image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=200&h=250&fit=crop' },
    { id: 'mock-w6', name: 'Statement Coat', category: 'Outerwear', image_url: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=200&h=250&fit=crop' },
];

export default {
    generateQuickShoot,
    fetchUserModels,
    fetchWardrobeItems,
    getGenerationHistory,
    addToGallery,
    checkCredits,
    deductCredits,
    addCredits,
    GENERATION_COSTS
};
