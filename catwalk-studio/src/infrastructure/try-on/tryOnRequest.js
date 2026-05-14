export const TRY_ON_BASE_COSTS = {
    standard: 5,
    hd: 10,
};

export function buildTryOnPayload({ selectedModel, selectedWardrobeItem, promptData }) {
    if (!selectedModel) {
        throw new Error('Try-on requires a selected model');
    }

    // Auto-inject gender keywords
    const gender = (selectedModel.gender || '').toLowerCase();
    let enhancedPrompt = promptData.prompt || '';
    let enhancedNegativePrompt = promptData.negativePrompt || null;

    if (gender === 'male' || gender === 'man' || (selectedModel.name || '').toLowerCase().includes('male')) {
        enhancedPrompt = `A male model, man, masculine, ${enhancedPrompt}`;
        enhancedNegativePrompt = enhancedNegativePrompt 
            ? `woman, female, girl, feminine, ${enhancedNegativePrompt}`
            : `woman, female, girl, feminine`;
    } else if (gender === 'female' || gender === 'woman' || (selectedModel.name || '').toLowerCase().includes('female')) {
        enhancedPrompt = `A female model, woman, feminine, ${enhancedPrompt}`;
        enhancedNegativePrompt = enhancedNegativePrompt 
            ? `man, male, boy, masculine, ${enhancedNegativePrompt}`
            : `man, male, boy, masculine`;
    }

    // Convert to snake_case as expected by most Supabase Edge Functions
    const payload = {
        prompt: enhancedPrompt || null,
        negative_prompt: enhancedNegativePrompt,
        // If it's a custom upload, we don't send the "custom_upload" string as ID
        wardrobe_item_id: selectedWardrobeItem?.id === 'custom_upload' ? null : (selectedWardrobeItem?.id || null),
        garment_url: selectedWardrobeItem?.highResImageUrl || selectedWardrobeItem?.thumbnailUrl || null,
        width: parseInt(promptData.width) || 768,
        height: parseInt(promptData.height) || 1024,
        format: promptData.format || 'png',
        quality: promptData.quality || 'standard',
        seed: promptData.seed === '' ? null : (parseInt(promptData.seed) || null),
    };

    let finalPayload;
    if (selectedModel.isUserAiCharacter) {
        finalPayload = {
            ...payload,
            ai_character_id: selectedModel.id,
            model_image_url: selectedModel.imageUrl || null,
        };
    } else {
        finalPayload = {
            ...payload,
            model_id: selectedModel.id,
            model_image_url: selectedModel.imageUrl || null,
        };
    }

    console.log('DEBUG: Final Payload (Snake Case):', finalPayload);
    return finalPayload;
}

export function getTryOnProgressMessage({ stage }) {
    if (stage === 'preparing_model') {
        return 'Preparing preview...';
    }

    return 'Styling preview...';
}
