import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { container } from '../di/container';
import { useAuth } from './useAuth';

/**
 * Query keys for credit-related queries
 */
export const creditKeys = {
    all: ['credits'],
    balance: (userId) => [...creditKeys.all, 'balance', userId],
    history: (userId) => [...creditKeys.all, 'history', userId],
};

/**
 * Hook to get credit balance
 * Uses GetCreditBalanceUseCase from Clean Architecture
 * 
 * @param {string} userId - User ID
 * @returns {Object} Query result with balance data
 */
export function useCreditBalance(userId) {
    const query = useQuery({
        queryKey: creditKeys.balance(userId),
        queryFn: async () => {
            const useCase = container.getCreditBalanceUseCase();
            const result = await useCase.execute(userId);

            if (result.isFailure()) {
                throw new Error(result.getError());
            }

            return result.getValue();
        },
        enabled: !!userId,
        staleTime: 1 * 60 * 1000, // 1 minute (balance changes frequently)
    });

    return {
        balance: query.data?.balance ?? 0,
        subscriptionTier: query.data?.subscriptionTier,
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
}

/**
 * Hook to get credit transaction history
 * Uses GetCreditHistoryUseCase
 * 
 * @param {string} userId - User ID
 * @param {number} [limit=50] - Maximum transactions to fetch
 * @returns {Object} Query result with transaction history
 */
export function useCreditHistory(userId, limit = 50) {
    const query = useQuery({
        queryKey: [...creditKeys.history(userId), limit],
        queryFn: async () => {
            const useCase = container.getCreditHistoryUseCase();
            const result = await useCase.execute({ userId, limit });

            if (result.isFailure()) {
                throw new Error(result.getError());
            }

            return result.getValue();
        },
        enabled: !!userId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    return {
        transactions: query.data || [],
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
}

/**
 * Hook to deduct credits
 * Uses DeductCreditsUseCase
 * 
 * @returns {Object} Mutation object
 */
export function useDeductCredits() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (data) => {
            const useCase = container.getDeductCreditsUseCase();
            const result = await useCase.execute(data);

            if (result.isFailure()) {
                throw new Error(result.getError());
            }

            return result.getValue();
        },
        onSuccess: (data, variables) => {
            // Invalidate and refetch balance and history
            queryClient.invalidateQueries({ queryKey: creditKeys.balance(variables.userId) });
            queryClient.invalidateQueries({ queryKey: creditKeys.history(variables.userId) });
        },
    });

    return {
        deductCredits: mutation.mutate,
        deductCreditsAsync: mutation.mutateAsync,
        isDeducting: mutation.isPending,
        error: mutation.error,
        data: mutation.data,
    };
}

/**
 * Hook to add credits
 * Uses AddCreditsUseCase
 * 
 * @returns {Object} Mutation object
 */
export function useAddCredits() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (data) => {
            const useCase = container.getAddCreditsUseCase();
            const result = await useCase.execute(data);

            if (result.isFailure()) {
                throw new Error(result.getError());
            }

            return result.getValue();
        },
        onSuccess: (data, variables) => {
            // Invalidate and refetch balance and history
            queryClient.invalidateQueries({ queryKey: creditKeys.balance(variables.userId) });
            queryClient.invalidateQueries({ queryKey: creditKeys.history(variables.userId) });
        },
    });

    return {
        addCredits: mutation.mutate,
        addCreditsAsync: mutation.mutateAsync,
        isAdding: mutation.isPending,
        error: mutation.error,
        data: mutation.data,
    };
}

/**
 * Legacy hook for backward compatibility
 * Maintains the same API as the old useCredits hook
 * 
 * @deprecated Use the new individual hooks instead:
 * - useCreditBalance(userId)
 * - useDeductCredits()
 * - useAddCredits()
 * - useCreditHistory(userId)
 */
export const useCredits = () => {
    const { user } = useAuth();
    const userId = user?.id;

    const { balance, isLoading: balanceLoading } = useCreditBalance(userId);
    const { deductCreditsAsync, isDeducting } = useDeductCredits();
    const { addCreditsAsync, isAdding } = useAddCredits();

    // Legacy methods with same signature
    const hasEnoughCredits = (amount) => {
        return balance >= amount;
    };

    const deductCreditsLegacy = async (amount, reason = 'generation') => {
        if (!userId) {
            return { success: false, error: 'User not authenticated' };
        }

        if (!hasEnoughCredits(amount)) {
            return { success: false, error: 'Insufficient credits' };
        }

        try {
            const result = await deductCreditsAsync({
                userId,
                amount,
                reason,
                metadata: {},
            });
            return { success: true, newBalance: result.newBalance };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const addCreditsLegacy = async (amount, reason = 'purchase') => {
        if (!userId) {
            return { success: false, error: 'User not authenticated' };
        }

        try {
            const result = await addCreditsAsync({
                userId,
                amount,
                reason,
                metadata: {},
            });
            return { success: true, newBalance: result.newBalance };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const getCreditCost = (action) => {
        const costs = {
            'quick_shoot_photo': 5,
            'quick_shoot_hd': 10,
            'video_generation': 25,
            'designer_item': 3,
            'ai_model_generation': 15,
            'run_compare': 5, // per model
        };
        return costs[action] ?? 0;
    };

    return {
        creditBalance: balance,
        loading: balanceLoading || isDeducting || isAdding,
        error: null,
        hasEnoughCredits,
        deductCredits: deductCreditsLegacy,
        addCredits: addCreditsLegacy,
        getCreditCost,
    };
};

export default useCredits;
