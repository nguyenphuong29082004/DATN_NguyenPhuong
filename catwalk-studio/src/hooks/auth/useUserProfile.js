import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { container } from '../../di/container';

/**
 * Query keys for user-related queries
 */
export const userKeys = {
    all: ['users'],
    profile: (id) => [...userKeys.all, 'profile', id],
};

/**
 * Hook to get user profile
 * Uses GetCurrentUserUseCase from Clean Architecture
 * 
 * @param {string} userId - User ID
 * @returns {Object} Query result with user data
 */
export function useUserProfile(userId) {
    const query = useQuery({
        queryKey: userKeys.profile(userId),
        queryFn: async () => {
            const useCase = container.getCurrentUserUseCase();
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
        user: query.data,
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
}

/**
 * Hook to update user profile
 * Uses UpdateUserProfileUseCase
 * 
 * @returns {Object} Mutation object
 */
export function useUpdateUserProfile() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (data) => {
            const useCase = container.getUpdateUserProfileUseCase();
            const result = await useCase.execute(data);

            if (result.isFailure()) {
                throw new Error(result.getError());
            }

            return result.getValue();
        },
        onSuccess: (_, variables) => {
            // Invalidate and refetch user profile
            queryClient.invalidateQueries({ queryKey: userKeys.profile(variables.userId) });
        },
    });

    return {
        updateProfile: mutation.mutate,
        updateProfileAsync: mutation.mutateAsync,
        isUpdating: mutation.isPending,
        error: mutation.error,
    };
}

/**
 * Hook to register a new user
 * Uses RegisterUserUseCase
 * 
 * @returns {Object} Mutation object
 */
export function useRegisterUser() {
    const mutation = useMutation({
        mutationFn: async (data) => {
            const useCase = container.getRegisterUserUseCase();
            const result = await useCase.execute(data);

            if (result.isFailure()) {
                throw new Error(result.getError());
            }

            return result.getValue();
        },
    });

    return {
        register: mutation.mutate,
        registerAsync: mutation.mutateAsync,
        isRegistering: mutation.isPending,
        error: mutation.error,
        user: mutation.data,
    };
}
