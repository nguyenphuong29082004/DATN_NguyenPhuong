export const QUICK_SHOOT_PROMPT_CATEGORIES = ['quick_shoot', 'fashion_model', 'product'];
export const TRY_ON_PROMPT_CATEGORIES = ['try_on'];

export function filterPromptsByCategories(prompts, allowedCategories) {
    const allowed = new Set(allowedCategories);
    return (prompts || []).filter(prompt => allowed.has(prompt.category));
}
