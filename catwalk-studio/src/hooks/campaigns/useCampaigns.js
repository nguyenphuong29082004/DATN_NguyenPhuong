import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { container } from '../../di/container';

/**
 * Query keys for campaign-related queries
 */
export const campaignKeys = {
    all: ['campaigns'],
    userCampaigns: (userId) => [...campaignKeys.all, 'user', userId],
    userCampaignsByStatus: (userId, status) => [...campaignKeys.userCampaigns(userId), status],
    campaignDetail: (id) => [...campaignKeys.all, 'detail', id],
};

/**
 * Hook to get user's campaigns (with generation counts)
 * 
 * @param {string} userId - User ID
 * @param {Object} [options] - Query options
 * @param {string} [options.status] - Filter by status
 * @returns {Object} Query result with campaigns
 */
export function useUserCampaigns(userId, options = {}) {
    const { status } = options;

    const query = useQuery({
        queryKey: status
            ? campaignKeys.userCampaignsByStatus(userId, status)
            : campaignKeys.userCampaigns(userId),
        queryFn: async () => {
            const useCase = container.getUserCampaignsUseCase();
            const result = await useCase.execute({
                userId,
                status,
                includeGenerationCount: true,
            });

            if (result.isFailure()) {
                throw new Error(result.getError());
            }

            return result.getValue();
        },
        enabled: !!userId,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });

    return {
        campaigns: query.data || [],
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
}

/**
 * Hook to create a campaign
 * 
 * @returns {Object} Mutation object
 */
export function useCreateCampaign() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (data) => {
            const useCase = container.getCreateCampaignUseCase();
            const result = await useCase.execute(data);

            if (result.isFailure()) {
                throw new Error(result.getError());
            }

            return result.getValue();
        },
        onSuccess: (_, variables) => {
            // Invalidate user campaigns
            queryClient.invalidateQueries({ queryKey: campaignKeys.userCampaigns(variables.userId) });
        },
    });

    return {
        createCampaign: mutation.mutate,
        createCampaignAsync: mutation.mutateAsync,
        isCreating: mutation.isPending,
        error: mutation.error,
    };
}

/**
 * Hook to archive/reactivate a campaign
 * 
 * @returns {Object} Mutation object
 */
export function useArchiveCampaign() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (data) => {
            const useCase = container.getArchiveCampaignUseCase();
            const result = await useCase.execute(data);

            if (result.isFailure()) {
                throw new Error(result.getError());
            }

            return result.getValue();
        },
        onSuccess: (_, variables) => {
            // Invalidate both the list and the detail
            queryClient.invalidateQueries({ queryKey: campaignKeys.userCampaigns(variables.userId) });
            queryClient.invalidateQueries({ queryKey: campaignKeys.campaignDetail(variables.campaignId) });
        },
    });

    return {
        archiveCampaign: mutation.mutate,
        archiveCampaignAsync: mutation.mutateAsync,
        isArchiving: mutation.isPending,
        error: mutation.error,
    };
}

/**
 * Hook to delete a campaign (including generations and R2 files)
 *
 * @returns {Object} Mutation object
 */
export function useDeleteCampaign() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (data) => {
            const useCase = container.getDeleteCampaignUseCase();
            const result = await useCase.execute(data);

            if (result.isFailure()) {
                throw new Error(result.getError());
            }

            return result.getValue();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: campaignKeys.userCampaigns(variables.userId) });
            queryClient.removeQueries({ queryKey: campaignKeys.campaignDetail(variables.campaignId) });
        },
    });

    return {
        deleteCampaign: mutation.mutate,
        deleteCampaignAsync: mutation.mutateAsync,
        isDeleting: mutation.isPending,
        error: mutation.error,
    };
}

/**
 * Hook to get a single campaign detail with its generations
 * 
 * @param {string} campaignId - Campaign ID
 * @param {string} userId - User ID (for ownership verification)
 * @returns {Object} Query result with campaign and generations
 */
export function useCampaignDetail(campaignId, userId) {
    const query = useQuery({
        queryKey: campaignKeys.campaignDetail(campaignId),
        queryFn: async () => {
            // Use the Supabase client directly for the detail query
            // since it needs a join with generated_content
            const { getSupabaseClient } = await import('../../infrastructure/supabase/supabase.client');
            const supabase = getSupabaseClient();

            // Fetch campaign
            const { data: campaignData, error: campaignError } = await supabase
                .from('campaigns')
                .select('*')
                .eq('campaign_id', campaignId)
                .eq('user_id', userId)
                .single();

            if (campaignError) throw new Error(campaignError.message);

            // Fetch generations for this campaign
            const { data: generations, error: genError } = await supabase
                .from('generations')
                .select('*, models(display_name, profile_image_url)')
                .eq('campaign_id', campaignId)
                .order('created_at', { ascending: false });

            if (genError) throw new Error(genError.message);

            return {
                campaign: campaignData,
                generations: generations || [],
            };
        },
        enabled: !!campaignId && !!userId,
        staleTime: 60 * 1000, // 1 minute
        refetchInterval: (query) => {
            const generations = query.state.data?.generations || [];
            const hasPending = generations.some((gen) => ['pending', 'processing'].includes(gen.status));
            return hasPending ? 3000 : false;
        },
    });

    return {
        campaign: query.data?.campaign || null,
        generations: query.data?.generations || [],
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
}
