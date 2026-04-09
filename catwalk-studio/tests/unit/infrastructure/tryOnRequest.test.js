import { describe, it, expect } from 'vitest';
import { buildTryOnPayload, getTryOnProgressMessage, TRY_ON_BASE_COSTS } from '../../../src/infrastructure/try-on/tryOnRequest.js';

describe('tryOnRequest helpers', () => {
    it('builds payload for AI character with direct model image', () => {
        const payload = buildTryOnPayload({
            selectedModel: {
                id: 'char-1',
                isUserAiCharacter: true,
                imageUrl: 'https://example.com/character.webp',
            },
            selectedWardrobeItem: {
                id: 'item-1',
                thumbnailUrl: 'https://example.com/garment.webp',
            },
            promptData: {
                prompt: 'editorial pose',
                negativePrompt: 'blurry',
                width: 896,
                height: 1120,
                format: 'png',
                quality: 'hd',
                seed: '42',
            },
        });

        expect(payload).toEqual({
            prompt: 'editorial pose',
            negativePrompt: 'blurry',
            aiCharacterId: 'char-1',
            modelImageUrl: 'https://example.com/character.webp',
            wardrobeItemId: 'item-1',
            garmentUrl: 'https://example.com/garment.webp',
            width: 896,
            height: 1120,
            format: 'png',
            quality: 'hd',
            seed: '42',
        });
    });

    it('builds payload for marketplace model without aiModelProviderName', () => {
        const payload = buildTryOnPayload({
            selectedModel: {
                id: 'model-1',
                isUserAiCharacter: false,
            },
            selectedWardrobeItem: {
                id: 'custom_upload',
                thumbnailUrl: 'https://example.com/upload.webp',
            },
            promptData: {
                prompt: 'dramatic lighting',
                negativePrompt: 'blurry hands',
                width: 768,
                height: 1344,
                format: 'jpg',
                quality: 'standard',
                seed: '123',
            },
        });

        expect(payload).toEqual({
            prompt: 'dramatic lighting',
            negativePrompt: 'blurry hands',
            modelId: 'model-1',
            wardrobeItemId: 'custom_upload',
            garmentUrl: 'https://example.com/upload.webp',
            width: 768,
            height: 1344,
            format: 'jpg',
            quality: 'standard',
            seed: '123',
        });
        expect(payload.aiModelProviderName).toBeUndefined();
        expect(payload.aiModelId).toBeUndefined();
    });

    it('throws when no source model is provided', () => {
        expect(() => buildTryOnPayload({
            selectedModel: null,
            selectedWardrobeItem: { id: 'item-1', thumbnailUrl: 'https://example.com/garment.webp' },
            promptData: {
                prompt: '',
                negativePrompt: '',
                width: 896,
                height: 1120,
                format: 'png',
                quality: 'standard',
                seed: '',
            },
        })).toThrow('Try-on requires a selected model');
    });

    it('returns correct progress message for marketplace preparation stage', () => {
        expect(getTryOnProgressMessage({
            isUserAiCharacter: false,
            stage: 'preparing_model',
        })).toBe('Preparing preview...');
    });

    it('returns correct progress message for applying clothing stage', () => {
        expect(getTryOnProgressMessage({
            isUserAiCharacter: true,
            stage: 'applying_clothing',
        })).toBe('Styling preview...');
    });

    it('exposes fixed base credit costs for try-on qualities', () => {
        expect(TRY_ON_BASE_COSTS.standard).toBe(5);
        expect(TRY_ON_BASE_COSTS.hd).toBe(10);
    });
});
