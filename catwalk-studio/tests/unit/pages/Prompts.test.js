import { describe, it, expect } from 'vitest';
import { PROMPT_CATEGORY_OPTIONS } from '../../../src/pages/LaunchStudio/pages/promptCategoryOptions.js';

describe('Prompts category options', () => {
    it('should expose the prompt categories currently present in the database', () => {
        expect(PROMPT_CATEGORY_OPTIONS).toEqual([
            { value: 'brand', label: 'Brand' },
            { value: 'campaign', label: 'Campaign' },
            { value: 'fashion_design', label: 'Fashion Design' },
            { value: 'fashion_model', label: 'Fashion Model' },
            { value: 'product', label: 'Product' },
            { value: 'quick_shoot', label: 'Quick Shoot' },
            { value: 'try_on', label: 'Try On' },
            { value: 'ugc', label: 'UGC' },
        ]);
    });
});
