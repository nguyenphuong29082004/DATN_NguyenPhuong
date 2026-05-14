export const TRY_ON_BASE_COSTS = {
    standard: 5,
    hd: 10,
};

export function buildTryOnPayload({ selectedModel, selectedWardrobeItem, promptData }) {
    if (!selectedModel) {
        throw new Error('Try-on requires a selected model');
    }

    const payload = {
        prompt: promptData.prompt,
        negativePrompt: promptData.negativePrompt,
        wardrobeItemId: selectedWardrobeItem?.id || null,
        garmentUrl: selectedWardrobeItem?.highResImageUrl || selectedWardrobeItem?.thumbnailUrl || null,
        width: promptData.width,
        height: promptData.height,
        format: promptData.format,
        quality: promptData.quality,
        seed: promptData.seed,
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
