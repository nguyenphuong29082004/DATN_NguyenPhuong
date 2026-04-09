import { describe, it, expect, beforeEach } from 'vitest';
import { Campaign } from '../../../src/domain/entities/Campaign.js';

describe('Campaign Entity', () => {
    let validProps;

    beforeEach(() => {
        validProps = {
            userId: 'user-123',
            name: 'Summer 2026',
        };
    });

    describe('Creation', () => {
        it('should create a campaign with valid props', () => {
            const campaign = Campaign.create(validProps);

            expect(campaign).toBeDefined();
            expect(campaign.name).toBe('Summer 2026');
            expect(campaign.status).toBe('active');
            expect(campaign.details).toBeNull();
            expect(campaign.generationIds).toHaveLength(0);
            expect(campaign.totalCost).toBe(0);
        });

        it('should create a campaign with details', () => {
            const campaign = Campaign.create({
                ...validProps,
                details: 'Summer collection photoshoot',
            });

            expect(campaign.details).toBe('Summer collection photoshoot');
        });

        it('should create a campaign with metadata', () => {
            const campaign = Campaign.create({
                ...validProps,
                metadata: { season: 'summer', year: 2026 },
            });

            expect(campaign.metadata).toEqual({ season: 'summer', year: 2026 });
        });

        it('should throw error if userId is missing', () => {
            const props = { ...validProps, userId: null };

            expect(() => Campaign.create(props)).toThrow('User ID is required');
        });

        it('should throw error if name is empty', () => {
            const props = { ...validProps, name: '' };

            expect(() => Campaign.create(props)).toThrow('Campaign name is required');
        });

        it('should throw error if name is whitespace only', () => {
            const props = { ...validProps, name: '   ' };

            expect(() => Campaign.create(props)).toThrow('Campaign name is required');
        });
    });

    describe('Archive / Reactivate', () => {
        it('should archive an active campaign', () => {
            const campaign = Campaign.create(validProps);

            campaign.archive();

            expect(campaign.status).toBe('archived');
            expect(campaign.isArchived()).toBe(true);
            expect(campaign.isActive()).toBe(false);
        });

        it('should throw error when archiving non-active campaign', () => {
            const campaign = Campaign.create(validProps);
            campaign.archive();

            expect(() => campaign.archive()).toThrow('Can only archive active campaigns');
        });

        it('should reactivate an archived campaign', () => {
            const campaign = Campaign.create(validProps);
            campaign.archive();

            campaign.reactivate();

            expect(campaign.status).toBe('active');
            expect(campaign.isActive()).toBe(true);
            expect(campaign.isArchived()).toBe(false);
        });

        it('should throw error when reactivating non-archived campaign', () => {
            const campaign = Campaign.create(validProps);

            expect(() => campaign.reactivate()).toThrow('Can only reactivate archived campaigns');
        });
    });

    describe('Generation Tracking', () => {
        it('should add generation to campaign', () => {
            const campaign = Campaign.create(validProps);

            campaign.addGeneration('gen-123', 10);

            expect(campaign.generationIds).toContain('gen-123');
            expect(campaign.totalCost).toBe(10);
            expect(campaign.generationCount).toBe(1);
        });

        it('should not add duplicate generation', () => {
            const campaign = Campaign.create(validProps);

            campaign.addGeneration('gen-123', 10);
            campaign.addGeneration('gen-123', 10);

            expect(campaign.generationIds).toHaveLength(1);
            expect(campaign.totalCost).toBe(10);
        });

        it('should track multiple generations', () => {
            const campaign = Campaign.create(validProps);

            campaign.addGeneration('gen-1', 5);
            campaign.addGeneration('gen-2', 10);
            campaign.addGeneration('gen-3', 5);

            expect(campaign.generationCount).toBe(3);
            expect(campaign.totalCost).toBe(20);
        });
    });

    describe('Access Control', () => {
        it('should verify ownership', () => {
            const campaign = Campaign.create(validProps);

            expect(campaign.isOwnedBy('user-123')).toBe(true);
            expect(campaign.isOwnedBy('user-456')).toBe(false);
        });
    });

    describe('Updates', () => {
        it('should update campaign name and details', () => {
            const campaign = Campaign.create(validProps);

            campaign.updateDetails({
                name: 'Winter 2026',
                details: 'Updated description',
            });

            expect(campaign.name).toBe('Winter 2026');
            expect(campaign.details).toBe('Updated description');
        });

        it('should update metadata', () => {
            const campaign = Campaign.create(validProps);

            campaign.updateDetails({
                metadata: { tags: ['editorial', 'luxury'] },
            });

            expect(campaign.metadata).toEqual({ tags: ['editorial', 'luxury'] });
        });

        it('should not allow updating non-allowed fields', () => {
            const campaign = Campaign.create(validProps);

            campaign.updateDetails({
                userId: 'hacker-id',
                status: 'archived',
            });

            expect(campaign.userId).toBe('user-123');
            expect(campaign.status).toBe('active');
        });
    });

    describe('toObject', () => {
        it('should convert to plain object', () => {
            const campaign = Campaign.create(validProps);
            const obj = campaign.toObject();

            expect(obj.name).toBe('Summer 2026');
            expect(obj.userId).toBe('user-123');
            expect(obj.status).toBe('active');
            expect(obj.generationCount).toBe(0);
            expect(obj).toHaveProperty('id');
            expect(obj).toHaveProperty('createdAt');
            expect(obj).toHaveProperty('updatedAt');
        });
    });
});
