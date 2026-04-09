import { describe, it, expect, beforeEach } from 'vitest';
import { Collection } from '../../../src/domain/entities/Collection.js';

describe('Collection Entity', () => {
    let validProps;

    beforeEach(() => {
        validProps = {
            userId: 'user-123',
            name: 'Summer Wardrobe',
        };
    });

    describe('Creation', () => {
        it('should create a collection with valid props', () => {
            const collection = Collection.create(validProps);

            expect(collection).toBeDefined();
            expect(collection.name).toBe('Summer Wardrobe');
            expect(collection.isPublic).toBe(false);
            expect(collection.itemIds).toEqual([]);
        });

        it('should throw error if userId is missing', () => {
            const props = { ...validProps, userId: null };

            expect(() => Collection.create(props)).toThrow('User ID is required');
        });

        it('should throw error if name is empty', () => {
            const props = { ...validProps, name: '' };

            expect(() => Collection.create(props)).toThrow('Collection name is required');
        });
    });

    describe('Item Management', () => {
        it('should add item to collection', () => {
            const collection = Collection.create(validProps);

            collection.addItem('item-1');
            collection.addItem('item-2');

            expect(collection.itemIds).toHaveLength(2);
            expect(collection.itemIds).toContain('item-1');
        });

        it('should throw error when adding duplicate item', () => {
            const collection = Collection.create(validProps);
            collection.addItem('item-1');

            expect(() => collection.addItem('item-1')).toThrow('Item already exists');
        });

        it('should remove item from collection', () => {
            const collection = Collection.create(validProps);
            collection.addItem('item-1');
            collection.addItem('item-2');

            collection.removeItem('item-1');

            expect(collection.itemIds).toHaveLength(1);
            expect(collection.itemIds).not.toContain('item-1');
        });

        it('should check if collection has item', () => {
            const collection = Collection.create(validProps);
            collection.addItem('item-1');

            expect(collection.hasItem('item-1')).toBe(true);
            expect(collection.hasItem('item-2')).toBe(false);
        });

        it('should get item count', () => {
            const collection = Collection.create(validProps);
            collection.addItem('item-1');
            collection.addItem('item-2');

            expect(collection.getItemCount()).toBe(2);
        });
    });

    describe('Visibility', () => {
        it('should make collection public', () => {
            const collection = Collection.create(validProps);

            collection.makePublic();

            expect(collection.isPublic).toBe(true);
        });

        it('should make collection private', () => {
            const collection = Collection.create({ ...validProps, isPublic: true });

            collection.makePrivate();

            expect(collection.isPublic).toBe(false);
        });
    });

    describe('Likes', () => {
        it('should increment likes on public collection', () => {
            const collection = Collection.create({ ...validProps, isPublic: true });

            collection.incrementLikes();

            expect(collection.likes).toBe(1);
        });

        it('should throw error when liking private collection', () => {
            const collection = Collection.create(validProps);

            expect(() => collection.incrementLikes()).toThrow('Cannot like a private collection');
        });
    });

    describe('Tags', () => {
        it('should add tag', () => {
            const collection = Collection.create(validProps);

            collection.addTag('Casual');

            expect(collection.tags).toContain('casual');
        });

        it('should not add duplicate tags', () => {
            const collection = Collection.create(validProps);

            collection.addTag('casual');
            collection.addTag('Casual');

            expect(collection.tags).toHaveLength(1);
        });

        it('should remove tag', () => {
            const collection = Collection.create(validProps);
            collection.addTag('casual');

            collection.removeTag('casual');

            expect(collection.tags).not.toContain('casual');
        });
    });

    describe('Access Control', () => {
        it('should verify ownership', () => {
            const collection = Collection.create(validProps);

            expect(collection.isOwnedBy('user-123')).toBe(true);
            expect(collection.isOwnedBy('user-456')).toBe(false);
        });

        it('should allow owner to view collection', () => {
            const collection = Collection.create(validProps);

            expect(collection.canBeViewedBy('user-123')).toBe(true);
        });

        it('should allow anyone to view public collection', () => {
            const collection = Collection.create({ ...validProps, isPublic: true });

            expect(collection.canBeViewedBy('other-user')).toBe(true);
        });
    });
});
