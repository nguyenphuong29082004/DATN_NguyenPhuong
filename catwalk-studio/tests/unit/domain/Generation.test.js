import { describe, it, expect, beforeEach } from 'vitest';
import { Generation } from '../../../src/domain/entities/Generation.js';

describe('Generation Entity', () => {
    let validProps;

    beforeEach(() => {
        validProps = {
            userId: 'user-123',
            modelId: 'model-456',
            prompt: 'A professional fashion photoshoot',
            quality: 'standard',
            status: 'pending',
        };
    });

    describe('Creation', () => {
        it('should create a generation with valid props', () => {
            const generation = Generation.create(validProps);

            expect(generation).toBeDefined();
            expect(generation.userId).toBe('user-123');
            expect(generation.prompt).toBe('A professional fashion photoshoot');
            expect(generation.status).toBe('pending');
            expect(generation.quality).toBe('standard');
        });

        it('should throw error if userId is missing', () => {
            const props = { ...validProps, userId: null };

            expect(() => Generation.create(props)).toThrow('User ID is required');
        });

        it('should throw error if prompt is empty', () => {
            const props = { ...validProps, prompt: '' };

            expect(() => Generation.create(props)).toThrow('Prompt is required');
        });

        it('should throw error if invalid status', () => {
            const props = { ...validProps, status: 'invalid' };

            expect(() => Generation.create(props)).toThrow('Invalid status');
        });

        it('should throw error if invalid quality', () => {
            const props = { ...validProps, quality: 'ultra' };

            expect(() => Generation.create(props)).toThrow('Quality must be standard or hd');
        });
    });

    describe('Status Management', () => {
        it('should mark generation as completed with image URL', () => {
            const generation = Generation.create(validProps);
            const imageUrl = 'https://example.com/image.jpg';

            generation.markAsCompleted(imageUrl);

            expect(generation.status).toBe('completed');
            expect(generation.imageUrl).toBe(imageUrl);
            expect(generation.isCompleted()).toBe(true);
        });

        it('should throw error when marking completed without image URL', () => {
            const generation = Generation.create(validProps);

            expect(() => generation.markAsCompleted('')).toThrow('Image URL is required');
        });

        it('should mark generation as failed with error message', () => {
            const generation = Generation.create(validProps);
            const errorMessage = 'AI service timeout';

            generation.markAsFailed(errorMessage);

            expect(generation.status).toBe('failed');
            expect(generation.errorMessage).toBe(errorMessage);
            expect(generation.isFailed()).toBe(true);
        });

        it('should check if generation is pending', () => {
            const generation = Generation.create(validProps);

            expect(generation.isPending()).toBe(true);
            expect(generation.isCompleted()).toBe(false);
        });
    });

    describe('Publishing', () => {
        it('should publish a completed generation', () => {
            const generation = Generation.create(validProps);
            generation.markAsCompleted('https://example.com/image.jpg');

            generation.publish();

            expect(generation.isPublished).toBe(true);
            expect(generation.publishedAt).toBeDefined();
        });

        it('should throw error when publishing incomplete generation', () => {
            const generation = Generation.create(validProps);

            expect(() => generation.publish()).toThrow('Cannot publish incomplete generation');
        });

        it('should throw error when publishing without image', () => {
            const generation = Generation.create({ ...validProps, status: 'completed' });

            expect(() => generation.publish()).toThrow('Cannot publish generation without image');
        });

        it('should unpublish a published generation', () => {
            const generation = Generation.create(validProps);
            generation.markAsCompleted('https://example.com/image.jpg');
            generation.publish();

            generation.unpublish();

            expect(generation.isPublished).toBe(false);
        });
    });

    describe('Likes', () => {
        it('should increment likes on published generation', () => {
            const generation = Generation.create(validProps);
            generation.markAsCompleted('https://example.com/image.jpg');
            generation.publish();

            generation.incrementLikes();

            expect(generation.likes).toBe(1);
        });

        it('should throw error when liking unpublished generation', () => {
            const generation = Generation.create(validProps);
            generation.markAsCompleted('https://example.com/image.jpg');

            expect(() => generation.incrementLikes()).toThrow('Cannot like unpublished generation');
        });

        it('should decrement likes', () => {
            const generation = Generation.create(validProps);
            generation.markAsCompleted('https://example.com/image.jpg');
            generation.publish();
            generation.incrementLikes();
            generation.incrementLikes();

            generation.decrementLikes();

            expect(generation.likes).toBe(1);
        });

        it('should not decrement likes below 0', () => {
            const generation = Generation.create(validProps);
            generation.markAsCompleted('https://example.com/image.jpg');
            generation.publish();

            generation.decrementLikes();

            expect(generation.likes).toBe(0);
        });
    });

    describe('Credit Cost', () => {
        it('should return 5 credits for standard quality', () => {
            const generation = Generation.create({ ...validProps, quality: 'standard' });

            expect(generation.getCreditCost()).toBe(5);
        });

        it('should return 10 credits for HD quality', () => {
            const generation = Generation.create({ ...validProps, quality: 'hd' });

            expect(generation.getCreditCost()).toBe(10);
        });
    });

    describe('Access Control', () => {
        it('should verify ownership', () => {
            const generation = Generation.create(validProps);

            expect(generation.isOwnedBy('user-123')).toBe(true);
            expect(generation.isOwnedBy('user-456')).toBe(false);
        });

        it('should allow owner to view generation', () => {
            const generation = Generation.create(validProps);

            expect(generation.canBeViewedBy('user-123')).toBe(true);
        });

        it('should allow anyone to view published generation', () => {
            const generation = Generation.create(validProps);
            generation.markAsCompleted('https://example.com/image.jpg');
            generation.publish();

            expect(generation.canBeViewedBy('other-user')).toBe(true);
        });

        it('should not allow others to view unpublished generation', () => {
            const generation = Generation.create(validProps);
            generation.markAsCompleted('https://example.com/image.jpg');

            expect(generation.canBeViewedBy('other-user')).toBe(false);
        });
    });
});
