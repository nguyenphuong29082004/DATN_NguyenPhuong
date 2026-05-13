import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { container } from '../../di/container';

/**
 * Query keys for generation-related queries
 */
export const generationKeys = {
    all: ['generations'],
    userGenerations: (userId) => [...generationKeys.all, 'user', userId],
    publicGenerations: () => [...generationKeys.all, 'public'],
    generationDetail: (id) => [...generationKeys.all, 'detail', id],
};

/**
 * Hook to get user's generation history
 * Uses GetGenerationHistoryUseCase
 * 
 * @param {string} userId - User ID
 * @param {Object} [options] - Query options
 * @param {number} [options.limit] - Maximum results
 * @param {string} [options.status] - Filter by status
 * @returns {Object} Query result with generations
 */
export function useGenerationHistory(userId, options = {}) {
    const { limit, status, type, refetchInterval } = options;

    const query = useQuery({
        queryKey: [...generationKeys.userGenerations(userId), limit, status, type],
        queryFn: async () => {
            const useCase = container.getGenerationHistoryUseCase();
            const result = await useCase.execute({ userId, limit, status, type });

            if (result.isFailure()) {
                throw new Error(result.getError());
            }

            return result.getValue();
        },
        enabled: !!userId,
        refetchInterval: refetchInterval || false,
    });

    return {
        generations: query.data || [],
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
}

/**
 * Hook to generate image (Quick Shoot)
 * Uses GenerateQuickShootUseCase
 * This orchestrates: credit check → deduction → AI generation → save
 * 
 * @returns {Object} Mutation object
 */
export function useGenerateQuickShoot() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (data) => {
            const useCase = container.getGenerateQuickShootUseCase();
            const result = await useCase.execute(data);

            if (result.isFailure()) {
                throw new Error(result.getError());
            }

            return result.getValue();
        },
        onSuccess: (data, variables) => {
            // Invalidate user generations and credit balance
            queryClient.invalidateQueries({ queryKey: generationKeys.userGenerations(variables.userId) });
            queryClient.invalidateQueries({ queryKey: ['credits', 'balance', variables.userId] });
        },
    });

    return {
        generate: mutation.mutate,
        generateAsync: mutation.mutateAsync,
        isGenerating: mutation.isPending,
        error: mutation.error,
        data: mutation.data,
    };
}

/**
 * Hook to publish generation to gallery
 * Uses PublishToGalleryUseCase
 * 
 * @returns {Object} Mutation object
 */
export function usePublishToGallery() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (data) => {
            const useCase = container.getPublishToGalleryUseCase();
            const result = await useCase.execute(data);

            if (result.isFailure()) {
                throw new Error(result.getError());
            }

            return result.getValue();
        },
        onSuccess: (_, variables) => {
            // Invalidate user generations and public gallery
            queryClient.invalidateQueries({ queryKey: generationKeys.userGenerations(variables.userId) });
            queryClient.invalidateQueries({ queryKey: generationKeys.publicGenerations() });
        },
    });

    return {
        publish: mutation.mutate,
        publishAsync: mutation.mutateAsync,
        isPublishing: mutation.isPending,
        error: mutation.error,
    };
}

/**
 * Hook to delete generation
 * Uses DeleteGenerationUseCase
 * 
 * @returns {Object} Mutation object
 */
export function useDeleteGeneration() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (data) => {
            const useCase = container.getDeleteGenerationUseCase();
            const result = await useCase.execute(data);

            if (result.isFailure()) {
                throw new Error(result.getError());
            }

            return result.getValue();
        },
        onSuccess: (_, variables) => {
            // Invalidate user generations
            queryClient.invalidateQueries({ queryKey: generationKeys.userGenerations(variables.userId) });
            // Invalidate AI characters list (used in Try-On/Quick Shoot selectors)
            queryClient.invalidateQueries({ queryKey: ['models', 'userCharacters', variables.userId] });
            
            // Invalidate campaign detail if campaignId provided
            if (variables.campaignId) {
                queryClient.invalidateQueries({ queryKey: ['campaigns', 'detail', variables.campaignId] });
            }
        },
    });

    return {
        deleteGeneration: mutation.mutate,
        deleteGenerationAsync: mutation.mutateAsync,
        isDeleting: mutation.isPending,
        error: mutation.error,
    };
}
/**
 * Hook to generate an AI model
 * Uses GenerateAIModelUseCase
 *
 * @returns {Object} Mutation object
 */
export function useGenerateAIModel() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async ({ userId, params }) => {
            const useCase = container.getGenerateAIModelUseCase();
            const result = await useCase.execute({ userId, params });

            if (result.isFailure()) {
                throw new Error(result.getError());
            }

            return result.getValue();
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: generationKeys.userGenerations(variables.userId) });
            queryClient.invalidateQueries({ queryKey: ['credits', 'balance', variables.userId] });
        },
    });

    return {
        generate: mutation.mutate,
        generateAsync: mutation.mutateAsync,
        isGenerating: mutation.isPending,
        error: mutation.error,
        data: mutation.data,
    };
}
