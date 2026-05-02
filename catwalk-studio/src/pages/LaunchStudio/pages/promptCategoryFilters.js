export const QUICK_SHOOT_PROMPT_CATEGORIES = ['quick_shoot', 'fashion_model', 'product'];
export const TRY_ON_PROMPT_CATEGORIES = ['try_on'];

export function filterPromptsByCategories(prompts, allowedCategories) {
    const allowed = new Set(allowedCategories);
    return (prompts || []).filter(prompt => {
        if (prompt.category && allowed.has(prompt.category)) return true;
        if (prompt.tags && prompt.tags.some(tag => allowed.has(tag))) return true;
        // If it's a platform default and has no tags/category that match, you might want to show it anyway or keep it filtered.
        // For now, let's also allow it if the title contains 'Quick Shoot' or 'Product'
        if ((prompt.name || '').toLowerCase().includes('quick shoot')) return true;
        return false;
    });
}
