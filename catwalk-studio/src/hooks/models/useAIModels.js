import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { container } from '../../di/container';

/**
 * Query keys for AI model-related queries
 */
export const aiModelKeys = {
    all: ['aiModels'],
    userModels: (userId) => [...aiModelKeys.all, 'user', userId],
    publicModels: (filters) => [...aiModelKeys.all, 'public', filters],
    modelDetail: (id) => [...aiModelKeys.all, 'detail', id],
};

/**
 * Hook to get user's own AI models
 * Uses GetUserModelsUseCase
 * 
 * @param {string} userId - User ID
 * @returns {Object} Query result with user models
 */
export function useUserModels(userId) {
    const query = useQuery({
        queryKey: aiModelKeys.userModels(userId),
        queryFn: async () => {
            const useCase = container.getUserModelsUseCase();
            const result = await useCase.execute(userId);

            if (result.isFailure()) {
                throw new Error(result.getError());
            }

            return result.getValue();
        },
        enabled: !!userId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    return {
        models: query.data || [],
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
}

/**
 * Hook to get public AI models (marketplace)
 * Uses GetPublicModelsUseCase
 * 
 * @param {Object} [filters] - Optional filters
 * @param {string} [filters.gender] - Filter by gender
 * @param {string} [filters.ethnicity] - Filter by ethnicity
 * @param {Array<string>} [filters.tags] - Filter by tags
 * @param {number} [filters.limit] - Maximum results
 * @returns {Object} Query result with public models
 */
export function usePublicModels(filters = {}) {
    const query = useQuery({
        queryKey: aiModelKeys.publicModels(filters),
        queryFn: async () => {
            const useCase = container.getPublicModelsUseCase();
            const result = await useCase.execute(filters);

            if (result.isFailure()) {
                throw new Error(result.getError());
            }

            return result.getValue();
        },
        staleTime: 10 * 60 * 1000, // 10 minutes (public models change less frequently)
    });

    return {
        models: query.data || [],
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
}

/**
 * Hook to create a new AI model
 * Uses CreateAIModelUseCase
 * 
 * @returns {Object} Mutation object
 */
export function useCreateModel() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (data) => {
            const useCase = container.getCreateAIModelUseCase();
            const result = await useCase.execute(data);

            if (result.isFailure()) {
                throw new Error(result.getError());
            }

            return result.getValue();
        },
        onSuccess: (_, variables) => {
            // Invalidate user models cache
            queryClient.invalidateQueries({ queryKey: aiModelKeys.userModels(variables.userId) });
        },
    });

    return {
        createModel: mutation.mutate,
        createModelAsync: mutation.mutateAsync,
        isCreating: mutation.isPending,
        error: mutation.error,
        data: mutation.data,
    };
}

/**
 * Hook to update model visibility
 * Uses UpdateModelVisibilityUseCase
 * 
 * @returns {Object} Mutation object
 */
export function useUpdateModelVisibility() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (data) => {
            const useCase = container.getUpdateModelVisibilityUseCase();
            const result = await useCase.execute(data);

            if (result.isFailure()) {
                throw new Error(result.getError());
            }

            return result.getValue();
        },
        onSuccess: (_, variables) => {
            // Invalidate both user models and public models
            queryClient.invalidateQueries({ queryKey: aiModelKeys.userModels(variables.userId) });
            queryClient.invalidateQueries({ queryKey: aiModelKeys.publicModels({}) });
        },
    });

    return {
        updateVisibility: mutation.mutate,
        updateVisibilityAsync: mutation.mutateAsync,
        isUpdating: mutation.isPending,
        error: mutation.error,
    };
}
