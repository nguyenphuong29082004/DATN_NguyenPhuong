import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { container } from '../../di/container';

/**
 * Query keys for wardrobe-related queries
 */
export const wardrobeKeys = {
    all: ['wardrobe'],
    userItems: (userId) => [...wardrobeKeys.all, 'user', userId],
    publicItems: () => [...wardrobeKeys.all, 'public'],
    userItemsInfinite: (userId, categories, pageSize) => [...wardrobeKeys.userItems(userId), 'infinite', categories?.length ? [...categories].sort().join(',') : 'all', pageSize],
    publicItemsInfinite: (categories, pageSize) => [...wardrobeKeys.publicItems(), 'infinite', categories?.length ? [...categories].sort().join(',') : 'all', pageSize],
};

function flattenWardrobePages(data) {
    return data?.pages?.flatMap(page => page.items || []) || [];
}

/**
 * Hook to get user's own wardrobe items
 */
export function useUserWardrobeItems(userId, options = {}) {
    const { enabled = true } = options;

    const query = useQuery({
        queryKey: wardrobeKeys.userItems(userId),
        queryFn: async () => {
            const useCase = container.getUserWardrobeItemsUseCase();
            const result = await useCase.execute(userId);

            if (result.isFailure()) {
                throw new Error(result.getError());
            }

            return result.getValue();
        },
        enabled: !!userId && enabled,
    });

    return {
        items: query.data || [],
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
}

/**
 * Hook to get public/platform wardrobe items
 */
export function usePublicWardrobeItems() {
    const query = useQuery({
        queryKey: wardrobeKeys.publicItems(),
        queryFn: async () => {
            const useCase = container.getPublicWardrobeItemsUseCase();
            const result = await useCase.execute();

            if (result.isFailure()) {
                throw new Error(result.getError());
            }

            return result.getValue();
        },
    });

    return {
        items: query.data || [],
        isLoading: query.isLoading,
        error: query.error,
    };
}

/**
 * Hook to get user's wardrobe items with server-side pagination
 */
export function useUserWardrobeItemsInfinite(userId, options = {}) {
    const { categories = [], pageSize = 20 } = options;

    const query = useInfiniteQuery({
        queryKey: wardrobeKeys.userItemsInfinite(userId, categories, pageSize),
        initialPageParam: 0,
        queryFn: async ({ pageParam }) => {
            const useCase = container.getUserWardrobeItemsUseCase();
            const result = await useCase.execute({
                userId,
                categories,
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
        items: flattenWardrobePages(query.data),
        isLoading: query.isLoading,
        error: query.error,
        hasNextPage: query.hasNextPage,
        isFetchingNextPage: query.isFetchingNextPage,
        fetchNextPage: query.fetchNextPage,
        refetch: query.refetch,
    };
}

/**
 * Hook to get platform wardrobe items with server-side pagination
 */
export function usePublicWardrobeItemsInfinite(options = {}) {
    const { categories = [], pageSize = 20 } = options;

    const query = useInfiniteQuery({
        queryKey: wardrobeKeys.publicItemsInfinite(categories, pageSize),
        initialPageParam: 0,
        queryFn: async ({ pageParam }) => {
            const useCase = container.getPublicWardrobeItemsUseCase();
            const result = await useCase.execute({
                categories,
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
        items: flattenWardrobePages(query.data),
        isLoading: query.isLoading,
        error: query.error,
        hasNextPage: query.hasNextPage,
        isFetchingNextPage: query.isFetchingNextPage,
        fetchNextPage: query.fetchNextPage,
        refetch: query.refetch,
    };
}

/**
 * Hook to create a new wardrobe item
 */
export function useCreateWardrobeItem() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (data) => {
            const useCase = container.getCreateWardrobeItemUseCase();
            const result = await useCase.execute(data);

            if (result.isFailure()) {
                throw new Error(result.getError());
            }

            return result.getValue();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: wardrobeKeys.userItems(variables.userId) });
        },
    });

    return {
        createItem: mutation.mutate,
        createItemAsync: mutation.mutateAsync,
        isCreating: mutation.isPending,
        error: mutation.error,
        data: mutation.data,
    };
}

/**
 * Hook to delete a wardrobe item
 */
export function useDeleteWardrobeItem() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (data) => {
            const useCase = container.getDeleteWardrobeItemUseCase();
            const result = await useCase.execute(data);

            if (result.isFailure()) {
                throw new Error(result.getError());
            }

            return result.getValue();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: wardrobeKeys.userItems(variables.userId) });
        },
    });

    return {
        deleteItem: mutation.mutate,
        deleteItemAsync: mutation.mutateAsync,
        isDeleting: mutation.isPending,
        error: mutation.error,
    };
}
