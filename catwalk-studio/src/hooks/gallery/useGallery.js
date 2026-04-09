import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { container } from '../../di/container';
import { usePublicModels } from '../models/useAIModels';
import { useAuth } from '../useAuth';

const LIKES_STORAGE_KEY = 'catwalk_gallery_likes';

/**
 * Helper to get liked items from localStorage
 */
const getLikedItemsFromStorage = () => {
    try {
        const saved = localStorage.getItem(LIKES_STORAGE_KEY);
        return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
        return new Set();
    }
};

/**
 * Helper to save liked items to localStorage
 */
const saveLikedItemsToStorage = (likedSet) => {
    try {
        localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify([...likedSet]));
    } catch {
        // Ignore
    }
};

/**
 * Query keys for gallery-related queries
 */
export const galleryKeys = {
    all: ['gallery'],
    generations: () => [...galleryKeys.all, 'generations'],
    models: () => [...galleryKeys.all, 'models'],
    item: (id) => [...galleryKeys.all, 'item', id],
};

/**
 * Hook to get gallery generations (public published)
 * 
 * @param {Object} [options] - Query options
 * @param {number} [options.limit] - Maximum results
 * @returns {Object} Query result with generations
 */
export function useGalleryGenerations(options = {}) {
    const { limit = 50 } = options;

    const query = useQuery({
        queryKey: [...galleryKeys.generations(), limit],
        queryFn: async () => {
            const useCase = container.getGalleryGenerationsUseCase();
            const result = await useCase.execute({ limit });

            if (result.isFailure()) {
                throw new Error(result.getError());
            }

            return result.getValue();
        },
        staleTime: 2 * 60 * 1000, // 2 minutes
    });

    return {
        generations: query.data || [],
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
}

/**
 * Hook to get gallery models (public models)
 * Uses existing usePublicModels but aliased for gallery context
 * 
 * @param {Object} [options] - Query options
 * @returns {Object} Query result with models
 */
export function useGalleryModels(options = {}) {
    return usePublicModels(options);
}

/**
 * Hook to like a generation
 * 
 * @returns {Object} Mutation object
 */
export function useLikeGeneration() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (data) => {
            const useCase = container.getLikeGenerationUseCase();
            const result = await useCase.execute(data);

            if (result.isFailure()) {
                throw new Error(result.getError());
            }

            return result.getValue();
        },
        onSuccess: () => {
            // Invalidate gallery generations
            queryClient.invalidateQueries({ queryKey: galleryKeys.generations() });
        },
    });

    return {
        likeGeneration: mutation.mutate,
        likeGenerationAsync: mutation.mutateAsync,
        isLiking: mutation.isPending,
        error: mutation.error,
    };
}

/**
 * Hook to like an AI model
 * 
 * @returns {Object} Mutation object
 */
export function useLikeAIModel() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (data) => {
            const useCase = container.getLikeAIModelUseCase();
            const result = await useCase.execute(data);

            if (result.isFailure()) {
                throw new Error(result.getError());
            }

            return result.getValue();
        },
        onSuccess: () => {
            // Invalidate gallery models and public models
            queryClient.invalidateQueries({ queryKey: galleryKeys.models() });
            queryClient.invalidateQueries({ queryKey: ['aiModels', 'public'] });
        },
    });

    return {
        likeModel: mutation.mutate,
        likeModelAsync: mutation.mutateAsync,
        isLiking: mutation.isPending,
        error: mutation.error,
    };
}

/**
 * Hook to get a single gallery item by ID
 */
export function useGalleryItem(galleryId) {
    const query = useQuery({
        queryKey: galleryKeys.item(galleryId),
        queryFn: async () => {
            const useCase = container.getGalleryItemUseCase();
            const result = await useCase.execute({ galleryId });

            if (result.isFailure()) {
                throw new Error(result.getError());
            }

            return result.getValue();
        },
        enabled: !!galleryId,
    });

    return {
        item: query.data || null,
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
}

/**
 * Hook to get paginated gallery items with filters
 */
export function useGalleryItems(options = {}) {
    const { page = 0, limit = 20, type, style } = options;

    const query = useQuery({
        queryKey: [...galleryKeys.generations(), page, limit, type, style],
        queryFn: async () => {
            const useCase = container.getGalleryItemsUseCase();
            const result = await useCase.execute({ page, limit, type, style });

            if (result.isFailure()) {
                throw new Error(result.getError());
            }

            return result.getValue();
        },
    });

    return {
        items: query.data?.items || [],
        hasMore: query.data?.hasMore || false,
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
}

/**
 * Hook to like a gallery item
 */
export function useLikeGalleryItem() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (data) => {
            const useCase = container.getLikeGalleryItemUseCase();
            const result = await useCase.execute(data);

            if (result.isFailure()) {
                throw new Error(result.getError());
            }

            return result.getValue();
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: galleryKeys.generations() });
            if (variables.galleryId) {
                queryClient.invalidateQueries({ queryKey: galleryKeys.item(variables.galleryId) });
            }
        },
    });

    return {
        likeItem: mutation.mutate,
        likeItemAsync: mutation.mutateAsync,
        isLiking: mutation.isPending,
        error: mutation.error,
    };
}
/**
 * Hook to manage local gallery likes (persistence in localStorage + DB sync for users)
 */
export function useGalleryLikeState() {
    const { user } = useAuth();
    const [likedIds, setLikedIds] = useState(() => getLikedItemsFromStorage());
    const isLoaded = true;

    // Load from DB if user is logged in
    useEffect(() => {
        if (user?.id) {
            const fetchUserLikes = async () => {
                try {
                    const useCase = container.getUserGalleryLikesUseCase();
                    const result = await useCase.execute({ userId: user.id });
                    if (result.isSuccess()) {
                        const dbLikes = result.getValue();
                        const local = getLikedItemsFromStorage();
                        const merged = new Set([...local, ...dbLikes]);
                        setLikedIds(merged);
                        saveLikedItemsToStorage(merged);
                    }
                } catch (e) {
                    console.error('Failed to sync user likes from DB', e);
                }
            };
            fetchUserLikes();
        }
    }, [user?.id]);

    const toggleLike = (id) => {
        const newSet = new Set(likedIds);
        const isLiked = newSet.has(id);
        
        if (isLiked) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        
        setLikedIds(newSet);
        saveLikedItemsToStorage(newSet);
        return !isLiked; // Returns new liked status
    };

    const isLiked = (id) => likedIds.has(id);

    return { likedIds, toggleLike, isLiked, userId: user?.id, isLoaded };
}
