import { describe, it, expect, beforeEach } from 'vitest';
import { User } from '../../../src/domain/entities/User.js';

describe('User Entity', () => {
    let validProps;

    beforeEach(() => {
        validProps = {
            id: 'user-123',
            email: 'test@example.com',
            username: 'testuser',
            credits: 100,
            subscriptionTier: 'free',
        };
    });

    describe('Creation', () => {
        it('should create a user with valid props', () => {
            const user = User.create(validProps);

            expect(user).toBeDefined();
            expect(user.email).toBe('test@example.com');
            expect(user.credits).toBe(100);
            expect(user.subscriptionTier).toBe('free');
        });

        it('should throw error if email is invalid', () => {
            const props = { ...validProps, email: 'invalid-email' };

            expect(() => User.create(props)).toThrow('Invalid email format');
        });

        it('should throw error if credits is negative', () => {
            const props = { ...validProps, credits: -10 };

            expect(() => User.create(props)).toThrow('Credits cannot be negative');
        });

        it('should throw error if subscription tier is invalid', () => {
            const props = { ...validProps, subscriptionTier: 'ultra' };

            expect(() => User.create(props)).toThrow('Invalid subscription tier');
        });
    });

    describe('Credit Management', () => {
        it('should add credits', () => {
            const user = User.create(validProps);

            user.addCredits(50);

            expect(user.credits).toBe(150);
        });

        it('should throw error when adding negative credits', () => {
            const user = User.create(validProps);

            expect(() => user.addCredits(-10)).toThrow('Amount must be positive');
        });

        it('should deduct credits', () => {
            const user = User.create(validProps);

            user.deductCredits(30);

            expect(user.credits).toBe(70);
        });

        it('should throw error when deducting more than available', () => {
            const user = User.create(validProps);

            expect(() => user.deductCredits(150)).toThrow('Insufficient credits');
        });

        it('should check if user can afford amount', () => {
            const user = User.create(validProps);

            expect(user.canAfford(50)).toBe(true);
            expect(user.canAfford(150)).toBe(false);
        });
    });

    describe('Profile Management', () => {
        it('should update profile with valid data', () => {
            const user = User.create(validProps);

            user.updateProfile({
                displayName: 'Test User',
                bio: 'A test bio',
            });

            expect(user.displayName).toBe('Test User');
            expect(user.bio).toBe('A test bio');
        });

        it('should not update email through updateProfile', () => {
            const user = User.create(validProps);
            const originalEmail = user.email;

            user.updateProfile({ email: 'new@example.com' });

            expect(user.email).toBe(originalEmail);
        });

        it('should not update credits through updateProfile', () => {
            const user = User.create(validProps);
            const originalCredits = user.credits;

            user.updateProfile({ credits: 999 });

            expect(user.credits).toBe(originalCredits);
        });
    });

    describe('Subscription Management', () => {
        it('should upgrade subscription tier', () => {
            const user = User.create(validProps);

            user.updateSubscriptionTier('pro');

            expect(user.subscriptionTier).toBe('pro');
        });

        it('should check if user is pro subscriber', () => {
            const user = User.create(validProps);
            expect(user.isProSubscriber()).toBe(false);

            user.updateSubscriptionTier('pro');
            expect(user.isProSubscriber()).toBe(true);
        });

        it('should check if user is free tier', () => {
            const user = User.create(validProps);

            expect(user.isFreeTier()).toBe(true);
        });
    });

    describe('Business Logic', () => {
        it('should grant welcome bonus', () => {
            const user = User.create(validProps);

            user.grantWelcomeBonus();

            expect(user.credits).toBe(150); // 100 + 50 default bonus
        });

        it('should check if profile is complete', () => {
            const user = User.create(validProps);
            expect(user.isProfileComplete()).toBe(false);

            user.updateProfile({
                displayName: 'Test User',
                bio: 'Bio',
                avatarUrl: 'https://example.com/avatar.jpg',
            });

            expect(user.isProfileComplete()).toBe(true);
        });
    });
});
