import { UseCase } from '../UseCase.js';
import { Model } from '../../../domain/entities/Model.js';
import { ModelMapper } from '../../../infrastructure/supabase/mappers/ModelMapper.js';

/**
 * Register Model Use Case
 * Handles the "Become a Model" registration flow.
 * Creates a new model profile and updates the user's type to 'model'.
 * 
 * Supports 3 account types per SRS:
 * - ai_only:   AI model only (license likeness)
 * - real_only: Real bookings only (traditional modeling)
 * - both:      Full platform access (AI + Real. Recommended)
 */
export class RegisterModelUseCase extends UseCase {
    /**
     * @param {import('../../../interfaces/repositories/IModelRepository').IModelRepository} modelRepository
     * @param {import('../../../interfaces/repositories/IUserRepository').IUserRepository} userRepository
     */
    constructor(modelRepository, userRepository, supabase) {
        super();
        this.modelRepository = modelRepository;
        this.userRepository = userRepository;
        this.supabase = supabase;
    }

    /**
     * @param {Object} input
     * @param {string} input.userId - Authenticated user's ID
     * @param {string} input.displayName - Public display name
     * @param {string} input.accountType - 'ai_only' | 'real_only' | 'both'
     * @param {number} [input.targetEarnings] - Monthly earnings goal
     * @param {string} [input.bioDraft] - AI-generated biography draft
     * @param {string} [input.location] - Location for real bookings
     * @param {string[]} [input.styleTags] - Style tags
     * @param {Object} [input.socialLinks] - { instagram, tiktok, website }
     * @param {Object} [input.photos] - { front, side, gallery[] }
     * @param {string[]} [input.contentPreferences] - Content categories accepted
     * @param {boolean} [input.eliteBoost] - Whether elite is enabled
     * @param {string[]} [input.types] - e.g. ['Editorial', 'Digital Only']
     * @param {number} [input.hourlyRate]
     * @param {number} [input.halfDayRate]
     * @param {number} [input.fullDayRate]
     * @returns {Promise<Model>}
     */
    async execute(input) {
        try {
            const { displayName, accountType } = input;

            if (!displayName || displayName.trim() === '') {
                throw new Error('Display name is required');
            }

            const validAccountTypes = ['ai_only', 'real_only', 'both'];
            if (!accountType || !validAccountTypes.includes(accountType)) {
                throw new Error('Account type must be "ai_only", "real_only", or "both"');
            }

            const contentPreferences = input.contentPreferences || [];
            if (contentPreferences.length === 0) {
                throw new Error('At least one content preference must be selected');
            }

            const galleryPhotos = input.photos?.gallery?.filter(Boolean) || [];
            const videoUrls = input.photos?.videos?.filter(Boolean) || [];
            const minPhotos = accountType === 'ai_only' ? 1 : 5;

            if (galleryPhotos.length < minPhotos) {
                throw new Error(`Minimum ${minPhotos} source photo${minPhotos > 1 ? 's' : ''} required for ${accountType} registration. Currently: ${galleryPhotos.length}`);
            }

            const payload = {
                displayName: input.displayName,
                accountType: input.accountType,
                profileImageUrl: galleryPhotos[0] || null,
                galleryImageUrls: galleryPhotos,
                videoUrls: videoUrls,
                modelTypes: input.types || [],
                styleTags: input.styleTags || [],
                bioDraft: input.bioDraft || null,
                location: input.location || null,
                contentPreferences: contentPreferences,
                monthlyTarget: input.targetEarnings || 0,
                elite: input.eliteBoost || false,
                hourlyRate: input.hourlyRate || null,
                halfDayRate: input.halfDayRate || null,
                fullDayRate: input.fullDayRate || null,
                socialLinks: input.socialLinks || [],
            };

            // Call Edge Function via Supabase client (proxy)
            const { data, error } = await this.supabase.functions.invoke('register-model', {
                body: { modelData: payload }
            });

            if (error || !data?.success) {
                throw new Error(error?.message || data?.error || 'Registration failed');
            }

            // Return the domain entity (mapped from API response)
            return ModelMapper.toDomain(data.model);

        } catch (error) {
            console.error('Error in RegisterModelUseCase:', error);
            throw error;
        }
    }
}
