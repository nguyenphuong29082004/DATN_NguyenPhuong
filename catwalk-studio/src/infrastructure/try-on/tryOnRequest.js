export const TRY_ON_BASE_COSTS = {
    standard: 5,
    hd: 10,
};

export function buildTryOnPayload({ selectedModel, selectedWardrobeItem, promptData }) {
    if (!selectedModel) {
        throw new Error('Try-on requires a selected model');
    }

    // Auto-inject gender keywords to improve AI accuracy
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

    const payload = {
        prompt: enhancedPrompt || null,
        negativePrompt: enhancedNegativePrompt,
        wardrobeItemId: selectedWardrobeItem?.id || null,
        garmentUrl: selectedWardrobeItem?.highResImageUrl || selectedWardrobeItem?.thumbnailUrl || null,
        width: promptData.width || null,
        height: promptData.height || null,
        format: promptData.format || null,
        quality: promptData.quality || null,
        seed: promptData.seed || null,
    };

    if (selectedModel.isUserAiCharacter) {
        return {
            ...payload,
            aiCharacterId: selectedModel.id,
            modelImageUrl: selectedModel.imageUrl || null,
        };
    }

    return {
        ...payload,
        modelId: selectedModel.id,
        modelImageUrl: selectedModel.imageUrl || null,
    };
}

export function getTryOnProgressMessage({ stage }) {
    if (stage === 'preparing_model') {
        return 'Preparing preview...';
    }

    return 'Styling preview...';
}
