import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { container } from '../../di/container';

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

export function useUpdateModelBio() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (data) => {
            const useCase = container.getUpdateModelBioUseCase();
            const result = await useCase.execute(data);
            if (result.isFailure()) throw new Error(result.getError());
            return result.getValue();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: modelKeys.byUsername(variables.username) });
        },
    });

    return {
        updateModelBio: mutation.mutate,
        updateModelBioAsync: mutation.mutateAsync,
        isUpdating: mutation.isPending,
        error: mutation.error,
    };
}

export function useRegisterModel() {
    const mutation = useMutation({
        mutationFn: async (input) => {
            const useCase = container.getRegisterModelUseCase();
            return useCase.execute(input);
        },
    });

    return {
        registerModel: mutation.mutate,
        registerModelAsync: mutation.mutateAsync,
        isRegistering: mutation.isPending,
        error: mutation.error,
    };
}

