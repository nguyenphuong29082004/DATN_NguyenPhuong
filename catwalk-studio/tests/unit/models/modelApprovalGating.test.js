import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetModelByUsernameUseCase } from '../../../src/application/use-cases/models/GetModelByUsernameUseCase.js';
import { GetShootableModelsUseCase } from '../../../src/application/use-cases/models/GetShootableModelsUseCase.js';

const getSupabaseClient = vi.fn();

vi.mock('../../../src/infrastructure/supabase/supabase.client.js', () => ({
    getSupabaseClient,
}));

describe('model approval gating', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('uses an explicit active-only repository method for public username lookups', async () => {
        const repository = {
            findPublicByUsername: async (username) => ({
                toObject: () => ({ username }),
            }),
            findByUsername: async () => {
                throw new Error('public route should not use mixed visibility lookup');
            },
        };

        const useCase = new GetModelByUsernameUseCase(repository);
        const result = await useCase.execute('anna');

        expect(result.isSuccess()).toBe(true);
        expect(result.getValue()).toEqual({ username: 'anna' });
    });

    it('does not require userId to get active-only shootable models', async () => {
        const models = [{ id: 'model-1', name: 'Anna' }];
        const repository = {
            findShootable: vi.fn().mockResolvedValue(models),
        };

        const useCase = new GetShootableModelsUseCase(repository);
        const result = await useCase.execute();

        expect(result.isSuccess()).toBe(true);
        expect(result.getValue()).toEqual(models);
        expect(repository.findShootable).toHaveBeenCalledTimes(1);
    });

    it('returns only active shootable models from the repository query', async () => {
        const activeRow = {
            model_id: 'model-1',
            display_name: 'Anna',
            username: 'anna',
            profile_image_url: 'https://example.com/anna.jpg',
            elite: false,
            elite_exp_date: null,
            style_tags: ['editorial'],
            price_per_image: 25,
            ai_model_id: 'ai-1',
            is_ai: true,
            gender: 'female',
            ethnicity: 'asian',
            body_type: 'slim',
            age_range: '20-29',
            can_book: true,
        };
        const inactiveRow = {
            ...activeRow,
            model_id: 'model-2',
            display_name: 'Inactive Anna',
        };

        let statusFilter;
        const query = {
            select: vi.fn(() => query),
            eq: vi.fn((column, value) => {
                if (column === 'status') {
                    statusFilter = value;
                }
                return query;
            }),
            order: vi.fn(async () => ({
                data: statusFilter === 'active' ? [activeRow] : [activeRow, inactiveRow],
                error: null,
            })),
        };
        const from = vi.fn(() => query);

        getSupabaseClient.mockReturnValue({ from });

        const { ModelRepository } = await import('../../../src/infrastructure/supabase/ModelRepository.js');
        const repository = new ModelRepository();

        const result = await repository.findShootable();

        expect(query.eq).toHaveBeenCalledWith('status', 'active');
        expect(result).toEqual([
            {
                id: 'model-1',
                name: 'Anna',
                imageUrl: 'https://example.com/anna.jpg',
                profileImageUrl: 'https://example.com/anna.jpg',
                badge: null,
                style: 'editorial',
                price: 25,
                aiModelId: 'ai-1',
                isAi: true,
                gender: 'female',
                ethnicity: 'asian',
                bodyType: 'slim',
                ageRange: '20-29',
                availability: 'Available for booking',
                rating: null,
            },
        ]);
    });
});
