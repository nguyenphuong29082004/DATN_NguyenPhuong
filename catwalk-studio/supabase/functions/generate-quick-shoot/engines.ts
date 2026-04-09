type EngineInputParams = {
    prompt: string
    negativePrompt?: string
    width?: number
    height?: number
    seed?: string | number | null
    format?: string
    imageUrl?: string | null
}

type EngineDefinition = {
    modelName: string
    buildInput: (params: EngineInputParams) => Record<string, unknown>
}

const DEFAULT_ASPECT_RATIO = '3:4'

function resolveAspectRatio(width?: number, height?: number): string {
    if (!width || !height) return DEFAULT_ASPECT_RATIO
    const ratio = width / height
    const map: [number, string][] = [
        [1, '1:1'],
        [4 / 5, '4:5'],
        [9 / 16, '9:16'],
        [16 / 9, '16:9'],
        [3 / 4, '3:4'],
        [4 / 3, '4:3'],
    ]

    let best = DEFAULT_ASPECT_RATIO
    let bestDiff = Infinity
    for (const [candidateRatio, label] of map) {
        const diff = Math.abs(ratio - candidateRatio)
        if (diff < bestDiff) {
            bestDiff = diff
            best = label
        }
    }

    return best
}

function parseSeed(seed?: string | number | null): number | undefined {
    if (seed === undefined || seed === null || seed === '') return undefined
    const parsed = typeof seed === 'number' ? seed : parseInt(seed, 10)
    return Number.isNaN(parsed) ? undefined : parsed
}

function withDefinedValues(input: Record<string, unknown>) {
    return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined && value !== null && value !== ''))
}

function getSizeInput(width?: number, height?: number) {
    if (!width || !height) {
        return { aspect_ratio: resolveAspectRatio(width, height) }
    }

    return { aspect_ratio: 'custom', width, height }
}

const defaultEngine: EngineDefinition = {
    modelName: 'black-forest-labs/flux-dev',
    buildInput: ({ prompt, negativePrompt, width, height, seed, format }) => withDefinedValues({
        prompt,
        negative_prompt: negativePrompt,
        aspect_ratio: resolveAspectRatio(width, height),
        output_format: format || 'png',
        seed: parseSeed(seed),
        output_quality: 90,
        safety_tolerance: 2,
    }),
}

const engineDefinitions: Record<string, EngineDefinition> = {
    'catwalk-ai-fast': {
        modelName: 'prunaai/p-image',
        // Text-to-image only: no image conditioning in Replicate input. Marketplace / character identity is prepended to prompt in generate-quick-shoot/index.ts.
        buildInput: ({ prompt, width, height, seed }) => withDefinedValues({
            prompt,
            ...getSizeInput(width, height),
            seed: parseSeed(seed),
        }),
    },
    'catwalk-ai-pro': {
        modelName: 'black-forest-labs/flux-1.1-pro',
        buildInput: ({ prompt, width, height, seed, format, imageUrl }) => withDefinedValues({
            prompt,
            ...getSizeInput(width, height),
            seed: parseSeed(seed),
            image_prompt: imageUrl,
            output_format: format || 'png',
            output_quality: 90,
            safety_tolerance: 2,
        }),
    },
    'catwalk-ai-pro-ultra': {
        modelName: 'google/imagen-4-ultra',
        buildInput: ({ prompt, width, height, format }) => withDefinedValues({
            prompt,
            aspect_ratio: resolveAspectRatio(width, height),
            image_size: '1K',
            output_format: format === 'png' ? 'png' : 'jpg',
            safety_filter_level: 'block_only_high',
        }),
    },
}

export function resolveEngine(frontendSlug?: string | null, backendModelName?: string | null): EngineDefinition {
    const engine = frontendSlug ? engineDefinitions[frontendSlug] : undefined
    if (!engine) {
        return backendModelName ? { ...defaultEngine, modelName: backendModelName } : defaultEngine
    }

    if (!backendModelName || backendModelName === engine.modelName) {
        return engine
    }

    return {
        ...engine,
        modelName: backendModelName,
    }
}
