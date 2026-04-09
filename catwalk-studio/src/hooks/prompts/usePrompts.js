import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { container } from '../../di/container';

/**
 * Query keys for prompt-related queries
 */
export const promptKeys = {
    all: ['prompts'],
    userPrompts: (userId) => [...promptKeys.all, 'user', userId],
    publicPrompts: () => [...promptKeys.all, 'public'],
    userPromptsInfinite: (userId, pageSize) => [...promptKeys.userPrompts(userId), 'infinite', pageSize],
    publicPromptsInfinite: (pageSize) => [...promptKeys.publicPrompts(), 'infinite', pageSize],
};

function flattenPromptPages(data) {
    return data?.pages?.flatMap(page => page.items || []) || [];
}

/**
 * Hook to get user's own prompts
 * Uses GetUserPromptsUseCase
 * 
 * @param {string} userId - User ID
 * @returns {Object} Query result with user prompts
 */
export function useUserPrompts(userId) {
    const query = useQuery({
        queryKey: promptKeys.userPrompts(userId),
        queryFn: async () => {
            const useCase = container.getUserPromptsUseCase();
            const result = await useCase.execute(userId);

            if (result.isFailure()) {
                throw new Error(result.getError());
            }

            return result.getValue();
        },
        enabled: !!userId,
    });

    return {
        prompts: query.data || [],
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
}

/**
 * Hook to get public and platform prompts
 * Uses GetPublicPromptsUseCase
 *
 * @returns {Object} Query result with public prompts
 */
export function usePublicPrompts() {
    const query = useQuery({
        queryKey: promptKeys.publicPrompts(),
        queryFn: async () => {
            const useCase = container.getPublicPromptsUseCase();
            const result = await useCase.execute();

            if (result.isFailure()) {
                throw new Error(result.getError());
            }

            return result.getValue();
        },
    });

    return {
        prompts: query.data || [],
        isLoading: query.isLoading,
        error: query.error,
    };
}

/**
 * Hook to get user's prompts with server-side pagination
 *
 * @param {string} userId - User ID
 * @param {Object} [options] - Pagination options
 * @param {number} [options.pageSize=20] - Page size
 * @returns {Object} Infinite query result with flattened prompts
 */
export function useUserPromptsInfinite(userId, options = {}) {
    const { pageSize = 20 } = options;

    const query = useInfiniteQuery({
        queryKey: promptKeys.userPromptsInfinite(userId, pageSize),
        initialPageParam: 0,
        queryFn: async ({ pageParam }) => {
            const useCase = container.getUserPromptsUseCase();
            const result = await useCase.execute({
                userId,
                limit: pageSize,
                offset: pageParam,
            });

            if (result.isFailure()) {
                throw new Error(result.getError());
            }

            return result.getValue();
        },
        getNextPageParam: (lastPage) => (lastPage?.hasMore ? lastPage.nextOffset : undefined),
        enabled: !!userId,
    });

    return {
        prompts: flattenPromptPages(query.data),
        isLoading: query.isLoading,
        error: query.error,
        hasNextPage: query.hasNextPage,
        isFetchingNextPage: query.isFetchingNextPage,
        fetchNextPage: query.fetchNextPage,
        refetch: query.refetch,
    };
}

/**
 * Hook to get public prompts with server-side pagination
 *
 * @param {Object} [options] - Pagination options
 * @param {number} [options.pageSize=20] - Page size
 * @returns {Object} Infinite query result with flattened prompts
 */
export function usePublicPromptsInfinite(options = {}) {
    const { pageSize = 20 } = options;

    const query = useInfiniteQuery({
        queryKey: promptKeys.publicPromptsInfinite(pageSize),
        initialPageParam: 0,
        queryFn: async ({ pageParam }) => {
            const useCase = container.getPublicPromptsUseCase();
            const result = await useCase.execute({
                limit: pageSize,
                offset: pageParam,
            });

            if (result.isFailure()) {
                throw new Error(result.getError());
            }

            return result.getValue();
        },
        getNextPageParam: (lastPage) => (lastPage?.hasMore ? lastPage.nextOffset : undefined),
    });

    return {
        prompts: flattenPromptPages(query.data),
        isLoading: query.isLoading,
        error: query.error,
        hasNextPage: query.hasNextPage,
        isFetchingNextPage: query.isFetchingNextPage,
        fetchNextPage: query.fetchNextPage,
        refetch: query.refetch,
    };
}

/**
 * Hook to create a new prompt
 * Uses CreatePromptUseCase
 * 
 * @returns {Object} Mutation object
 */
export function useCreatePrompt() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (data) => {
            const useCase = container.getCreatePromptUseCase();
            const result = await useCase.execute(data);

            if (result.isFailure()) {
                throw new Error(result.getError());
            }

            return result.getValue();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: promptKeys.userPrompts(variables.userId) });
            queryClient.invalidateQueries({ queryKey: promptKeys.publicPrompts() });
        },
    });

    return {
        createPrompt: mutation.mutate,
        createPromptAsync: mutation.mutateAsync,
        isCreating: mutation.isPending,
        error: mutation.error,
        data: mutation.data,
    };
}

/**
 * Hook to update a prompt
 * Uses UpdatePromptUseCase
 * 
 * @returns {Object} Mutation object
 */
export function useUpdatePrompt() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (data) => {
            const useCase = container.getUpdatePromptUseCase();
            const result = await useCase.execute(data);

            if (result.isFailure()) {
                throw new Error(result.getError());
            }

            return result.getValue();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: promptKeys.userPrompts(variables.userId) });
            queryClient.invalidateQueries({ queryKey: promptKeys.publicPrompts() });
        },
    });

    return {
        updatePrompt: mutation.mutate,
        updatePromptAsync: mutation.mutateAsync,
        isUpdating: mutation.isPending,
        error: mutation.error,
    };
}

/**
 * Hook to delete a prompt
 * Uses DeletePromptUseCase
 * 
 * @returns {Object} Mutation object
 */
export function useDeletePrompt() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (data) => {
            const useCase = container.getDeletePromptUseCase();
            const result = await useCase.execute(data);

            if (result.isFailure()) {
                throw new Error(result.getError());
            }

            return result.getValue();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: promptKeys.userPrompts(variables.userId) });
            queryClient.invalidateQueries({ queryKey: promptKeys.publicPrompts() });
        },
    });

    return {
        deletePrompt: mutation.mutate,
        deletePromptAsync: mutation.mutateAsync,
        isDeleting: mutation.isPending,
        error: mutation.error,
    };
}
