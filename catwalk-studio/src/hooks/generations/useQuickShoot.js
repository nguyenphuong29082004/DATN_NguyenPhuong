import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { container } from '../../di/container';

export function useInvokeQuickShoot() {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: async (body) => {
            const useCase = container.getInvokeQuickShootUseCase();
            const result = await useCase.execute(body);
            if (result.isFailure()) throw new Error(result.getError());
            return result.getValue();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['credits', 'balance'] });
        },
    });
    return {
        invoke: mutation.mutate,
        invokeAsync: mutation.mutateAsync,
        isInvoking: mutation.isPending,
        error: mutation.error,
        data: mutation.data,
    };
}

export function useGenerationStatus(generationId) {
    const query = useQuery({
        queryKey: ['generation', 'status', generationId],
        queryFn: async () => {
            const useCase = container.getGenerationStatusUseCase();
            const result = await useCase.execute({ generationId });
            if (result.isFailure()) throw new Error(result.getError());
            return result.getValue();
        },
        enabled: !!generationId,
        refetchInterval: (query) => {
            const data = query.state.data;
            if (!data) return 3000;
            const doneStatuses = ['completed', 'failed', 'timeout', 'canceled'];
            return doneStatuses.includes(data.status) ? false : 3000;
        },
    });
    return {
        generation: query.data || null,
        isLoading: query.isLoading,
        error: query.error,
    };
}

export function useAddToGallery() {
    const mutation = useMutation({
        mutationFn: async (data) => {
            const useCase = container.getAddToGalleryUseCase();
            const result = await useCase.execute(data);
            if (result.isFailure()) throw new Error(result.getError());
            return result.getValue();
        },
    });
    return {
        addToGallery: mutation.mutate,
        addToGalleryAsync: mutation.mutateAsync,
        isAdding: mutation.isPending,
        error: mutation.error,
    };
}

export function useSaveGeneration() {
    const mutation = useMutation({
        mutationFn: async ({ generationId }) => {
            const useCase = container.getSaveGenerationUseCase();
            const result = await useCase.execute({ generationId });
            if (result.isFailure()) throw new Error(result.getError());
            return result.getValue();
        },
    });
    return {
        saveGeneration: mutation.mutate,
        saveGenerationAsync: mutation.mutateAsync,
        isSaving: mutation.isPending,
        error: mutation.error,
    };
}
