import { useQuery } from '@tanstack/react-query';
import { container } from '../../di/container';

export const shootModelKeys = {
    shootable: (userId) => ['models', 'shootable', userId],
    aiEngines: () => ['models', 'aiEngines'],
    userCharacters: (userId) => ['models', 'userCharacters', userId],
};

export function useShootableModels(userId) {
    const query = useQuery({
        queryKey: shootModelKeys.shootable(userId),
        queryFn: async () => {
            const useCase = container.getShootableModelsUseCase();
            const result = await useCase.execute({ userId });
            if (result.isFailure()) throw new Error(result.getError());
            return result.getValue();
        },
        enabled: true,
    });
    return { models: query.data || [], isLoading: query.isLoading, error: query.error };
}

export function useAIEngines() {
    const query = useQuery({
        queryKey: shootModelKeys.aiEngines(),
        queryFn: async () => {
            const useCase = container.getAIEnginesUseCase();
            const result = await useCase.execute();
            if (result.isFailure()) throw new Error(result.getError());
            return result.getValue();
        },
    });
    return { engines: query.data || [], isLoading: query.isLoading, error: query.error };
}

export function useUserAICharacters(userId) {
    const query = useQuery({
        queryKey: shootModelKeys.userCharacters(userId),
        queryFn: async () => {
            const useCase = container.getUserAICharactersUseCase();
            const result = await useCase.execute({ userId });
            if (result.isFailure()) throw new Error(result.getError());
            return result.getValue();
        },
        enabled: !!userId,
    });
    return { characters: query.data || [], isLoading: query.isLoading, error: query.error };
}
