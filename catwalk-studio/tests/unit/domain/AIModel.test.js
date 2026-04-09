import { describe, it, expect, beforeEach } from 'vitest';
import { AIModel } from '../../../src/domain/entities/AIModel.js';

describe('AIModel Entity', () => {
    let validProps;

    beforeEach(() => {
        validProps = {
            userId: 'user-123',
            name: 'Fashion Model',
            gender: 'female',
            isPublic: false,
        };
    });

    describe('Creation', () => {
        it('should create an AI model with valid props', () => {
            const model = AIModel.create(validProps);

            expect(model).toBeDefined();
            expect(model.name).toBe('Fashion Model');
            expect(model.gender).toBe('female');
            expect(model.isPublic).toBe(false);
        });

        it('should throw error if userId is missing', () => {
            const props = { ...validProps, userId: null };

            expect(() => AIModel.create(props)).toThrow('User ID is required');
        });

        it('should throw error if name is empty', () => {
            const props = { ...validProps, name: '' };

            expect(() => AIModel.create(props)).toThrow('Model name is required');
        });

        it('should throw error if invalid gender', () => {
            const props = { ...validProps, gender: 'unknown' };

            expect(() => AIModel.create(props)).toThrow('Invalid gender');
        });
    });

    describe('Visibility Management', () => {
        it('should make model public', () => {
            const model = AIModel.create(validProps);

            model.makePublic();

            expect(model.isPublic).toBe(true);
        });

        it('should make model private', () => {
            const model = AIModel.create({ ...validProps, isPublic: true });

            model.makePrivate();

            expect(model.isPublic).toBe(false);
        });

        it('should update visibility', () => {
            const model = AIModel.create(validProps);

            model.updateVisibility(true);

            expect(model.isPublic).toBe(true);
        });
    });

    describe('Likes', () => {
        it('should increment likes on public model', () => {
            const model = AIModel.create({ ...validProps, isPublic: true });

            model.incrementLikes();

            expect(model.likes).toBe(1);
        });

        it('should throw error when liking private model', () => {
            const model = AIModel.create(validProps);

            expect(() => model.incrementLikes()).toThrow('Cannot like a private model');
        });

        it('should decrement likes', () => {
            const model = AIModel.create({ ...validProps, isPublic: true });
            model.incrementLikes();
            model.incrementLikes();

            model.decrementLikes();

            expect(model.likes).toBe(1);
        });
    });

    describe('Usage Tracking', () => {
        it('should increment usage count', () => {
            const model = AIModel.create(validProps);

            model.incrementUsageCount();
            model.incrementUsageCount();

            expect(model.usageCount).toBe(2);
        });
    });

    describe('Tags', () => {
        it('should add tag with normalization', () => {
            const model = AIModel.create(validProps);

            model.addTag('Fashion');
            model.addTag('EDITORIAL');

            expect(model.tags).toContain('fashion');
            expect(model.tags).toContain('editorial');
        });

        it('should not add duplicate tags', () => {
            const model = AIModel.create(validProps);

            model.addTag('fashion');
            model.addTag('Fashion');

            expect(model.tags).toHaveLength(1);
        });

        it('should remove tag', () => {
            const model = AIModel.create(validProps);
            model.addTag('fashion');
            model.addTag('editorial');

            model.removeTag('fashion');

            expect(model.tags).not.toContain('fashion');
            expect(model.tags).toContain('editorial');
        });
    });

    describe('Access Control', () => {
        it('should verify ownership', () => {
            const model = AIModel.create(validProps);

            expect(model.isOwnedBy('user-123')).toBe(true);
            expect(model.isOwnedBy('user-456')).toBe(false);
        });

        it('should allow owner to view model', () => {
            const model = AIModel.create(validProps);

            expect(model.canBeViewedBy('user-123')).toBe(true);
        });

        it('should allow anyone to view public model', () => {
            const model = AIModel.create({ ...validProps, isPublic: true });

            expect(model.canBeViewedBy('other-user')).toBe(true);
        });

        it('should not allow others to view private model', () => {
            const model = AIModel.create(validProps);

            expect(model.canBeViewedBy('other-user')).toBe(false);
        });
    });

    describe('Updates', () => {
        it('should update model details', () => {
            const model = AIModel.create(validProps);

            model.updateDetails({
                description: 'Updated description',
                ethnicity: 'asian',
            });

            expect(model.description).toBe('Updated description');
            expect(model.ethnicity).toBe('asian');
        });

        it('should not update userId through updateDetails', () => {
            const model = AIModel.create(validProps);
            const originalUserId = model.userId;

            model.updateDetails({ userId: 'hacker-user' });

            expect(model.userId).toBe(originalUserId);
        });
    });
});
