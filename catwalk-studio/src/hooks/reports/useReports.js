import { useMutation } from '@tanstack/react-query';
import { container } from '../../di/container';

/**
 * Hook to create a model report
 * Uses CreateReportUseCase
 */
export function useCreateReport() {
    const mutation = useMutation({
        mutationFn: async (data) => {
            const useCase = container.getCreateReportUseCase();
            const result = await useCase.execute(data);

            if (result.isFailure()) {
                throw new Error(result.getError());
            }

            return result.getValue();
        },
    });

    return {
        createReport: mutation.mutate,
        createReportAsync: mutation.mutateAsync,
        isCreating: mutation.isPending,
        error: mutation.error,
        isSuccess: mutation.isSuccess,
    };
}
