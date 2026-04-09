import { describe, it, expect } from 'vitest';
import {
    QUICK_SHOOT_PROMPT_CATEGORIES,
    TRY_ON_PROMPT_CATEGORIES,
    filterPromptsByCategories,
} from '../../../src/pages/LaunchStudio/pages/promptCategoryFilters.js';

describe('prompt category filters', () => {
    it('should keep only categories allowed for quick shoot', () => {
        const prompts = [
            { id: '1', category: 'quick_shoot' },
            { id: '2', category: 'fashion_model' },
            { id: '3', category: 'product' },
            { id: '4', category: 'try_on' },
        ];

        expect(filterPromptsByCategories(prompts, QUICK_SHOOT_PROMPT_CATEGORIES)).toEqual([
            { id: '1', category: 'quick_shoot' },
            { id: '2', category: 'fashion_model' },
            { id: '3', category: 'product' },
        ]);
    });

    it('should keep only try on prompts for try on', () => {
        const prompts = [
            { id: '1', category: 'quick_shoot' },
            { id: '2', category: 'try_on' },
            { id: '3', category: 'fashion_model' },
        ];

        expect(filterPromptsByCategories(prompts, TRY_ON_PROMPT_CATEGORIES)).toEqual([
            { id: '2', category: 'try_on' },
        ]);
    });
});
