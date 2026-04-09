import { useMutation, useQueryClient } from '@tanstack/react-query';
import { container } from '../../di/container';

export function useInvokeTryOn() {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: async (body) => {
            const useCase = container.getInvokeTryOnUseCase();
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
