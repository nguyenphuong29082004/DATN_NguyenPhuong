import { useQuery } from '@tanstack/react-query';
import { container } from '../../di/container';

/**
 * Query keys for model-related queries
 */
export const modelKeys = {
    all: ['models'],
    public: (filters) => ['models', 'public', filters],
    byUsername: (username) => ['models', 'username', username],
};

/**
 * Hook to fetch all public/active models (Elite first)
 * Used by: ModelsPage, Marketplace
 */
export function usePublicModels(filters = {}) {
    const useCase = container.getPublicModelsUseCase();

    const { data, isLoading, error } = useQuery({
        queryKey: modelKeys.public(filters),
        queryFn: async () => {
            const result = await useCase.execute(filters);
            if (result.isFailure()) throw new Error(result.error);
            return result.getValue();
        },
    });

    return {
        models: data || [],
        isLoading,
        error,
    };
}

/**
 * Hook to fetch a single model by username
 * Used by: ModelProfilePage
 */
export function useModelByUsername(username) {
    const useCase = container.getModelByUsernameUseCase();

    const { data, isLoading, error } = useQuery({
        queryKey: modelKeys.byUsername(username),
        queryFn: async () => {
            const result = await useCase.execute(username);
            if (result.isFailure()) throw new Error(result.error);
            return result.getValue();
        },
        enabled: !!username,
    });

    return {
        model: data || null,
        isLoading,
        error,
    };
}

