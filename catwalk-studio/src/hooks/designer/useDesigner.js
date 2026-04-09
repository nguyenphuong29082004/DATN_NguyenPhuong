import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { container } from '../../di/container';

/**
 * Query keys for designer-related queries
 */
export const designerKeys = {
    all: ['designer'],
    collections: (userId) => [...designerKeys.all, 'collections', userId],
    wardrobe: (userId) => [...designerKeys.all, 'wardrobe', userId],
    wardrobeByCategory: (userId, category) => [...designerKeys.wardrobe(userId), category],
};

/**
 * Hook to get user's collections
 * 
 * @param {string} userId - User ID
 * @returns {Object} Query result with collections
 */
export function useUserCollections(userId) {
    const query = useQuery({
        queryKey: designerKeys.collections(userId),
        queryFn: async () => {
            const useCase = container.getUserCollectionsUseCase();
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
        collections: query.data || [],
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
}

/**
 * Hook to get user's wardrobe items
 * 
 * @param {string} userId - User ID
 * @param {Object} [options] - Query options
 * @param {string} [options.category] - Filter by category
 * @returns {Object} Query result with items
 */
export function useWardrobeItems(userId, options = {}) {
    const { category } = options;

    const query = useQuery({
        queryKey: category
            ? designerKeys.wardrobeByCategory(userId, category)
            : designerKeys.wardrobe(userId),
        queryFn: async () => {
            const useCase = container.getWardrobeItemsUseCase();
            const result = await useCase.execute({ userId, category });

            if (result.isFailure()) {
                throw new Error(result.getError());
            }

            return result.getValue();
        },
        enabled: !!userId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    return {
        items: query.data || [],
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
}

/**
 * Hook to create a collection
 * 
 * @returns {Object} Mutation object
 */
export function useCreateCollection() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (data) => {
            const useCase = container.getCreateCollectionUseCase();
            const result = await useCase.execute(data);

            if (result.isFailure()) {
                throw new Error(result.getError());
            }

            return result.getValue();
        },
        onSuccess: (_, variables) => {
            // Invalidate user collections
            queryClient.invalidateQueries({ queryKey: designerKeys.collections(variables.userId) });
        },
    });

    return {
        createCollection: mutation.mutate,
        createCollectionAsync: mutation.mutateAsync,
        isCreating: mutation.isPending,
        error: mutation.error,
    };
}

/**
 * Hook to delete a collection
 * 
 * @returns {Object} Mutation object
 */
export function useDeleteCollection() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (data) => {
            const useCase = container.getDeleteCollectionUseCase();
            const result = await useCase.execute(data);

            if (result.isFailure()) {
                throw new Error(result.getError());
            }

            return result.getValue();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: designerKeys.collections(variables.userId) });
        },
    });

    return {
        deleteCollection: mutation.mutate,
        deleteCollectionAsync: mutation.mutateAsync,
        isDeleting: mutation.isPending,
        error: mutation.error,
    };
}

/**
 * Hook to create a designer item
 * 
 * @returns {Object} Mutation object
 */
export function useCreateDesignerItem() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (data) => {
            const useCase = container.getCreateDesignerItemUseCase();
            const result = await useCase.execute(data);

            if (result.isFailure()) {
                throw new Error(result.getError());
            }

            return result.getValue();
        },
        onSuccess: (_, variables) => {
            // Invalidate user wardrobe
            queryClient.invalidateQueries({ queryKey: designerKeys.wardrobe(variables.userId) });
        },
    });

    return {
        createItem: mutation.mutate,
        createItemAsync: mutation.mutateAsync,
        isCreating: mutation.isPending,
        error: mutation.error,
    };
}
