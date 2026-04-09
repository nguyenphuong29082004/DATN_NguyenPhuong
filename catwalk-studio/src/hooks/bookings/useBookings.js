import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { container } from '../../di/container';

/**
 * Hook to create a model booking
 * Uses CreateBookingUseCase
 */
export function useCreateBooking() {
    const mutation = useMutation({
        mutationFn: async (data) => {
            const useCase = container.getCreateBookingUseCase();
            const result = await useCase.execute(data);

            if (result.isFailure()) {
                throw new Error(result.getError());
            }

            return result.getValue();
        },
    });

    return {
        createBooking: mutation.mutate,
        createBookingAsync: mutation.mutateAsync,
        isCreating: mutation.isPending,
        error: mutation.error,
        isSuccess: mutation.isSuccess,
    };
}

/**
 * Hook to get bookings for a user's models
 */
export function useModelBookings(userId) {
    return useQuery({
        queryKey: ['bookings', 'model', userId],
        queryFn: async () => {
            if (!userId) return [];
            const useCase = container.getGetModelBookingsUseCase();
            const result = await useCase.execute(userId);
            if (result.isFailure()) throw new Error(result.getError());
            return result.getValue();
        },
        enabled: !!userId,
    });
}

/**
 * Hook to get bookings made by a user (as a brand)
 */
export function useBrandBookings(userId) {
    return useQuery({
        queryKey: ['bookings', 'brand', userId],
        queryFn: async () => {
            if (!userId) return [];
            const useCase = container.getGetBrandBookingsUseCase();
            const result = await useCase.execute(userId);
            if (result.isFailure()) throw new Error(result.getError());
            return result.getValue();
        },
        enabled: !!userId,
    });
}

/**
 * Hook to update booking status
 */
export function useUpdateBookingStatus() {
    const queryClient = useQueryClient();
    
    const mutation = useMutation({
        mutationFn: async ({ bookingId, status }) => {
            const useCase = container.getUpdateBookingStatusUseCase();
            const result = await useCase.execute({ bookingId, status });
            if (result.isFailure()) throw new Error(result.getError());
            return result.getValue();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
        }
    });

    return {
        updateBookingStatus: mutation.mutateAsync,
        isUpdating: mutation.isPending,
        error: mutation.error
    };
}
