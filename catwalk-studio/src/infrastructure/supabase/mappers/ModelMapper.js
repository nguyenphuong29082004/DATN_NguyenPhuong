import { Model } from '../../../domain/entities/Model.js';

/**
 * Model Mapper
 * Maps between database rows (models table) and Model entities
 */
export class ModelMapper {
    /**
     * Convert database row to Model entity
     * @param {Object} row - Database row from models table
     * @returns {Model} Model entity
     */
    static toDomain(row) {
        if (!row) return null;

        const props = {
            displayName: row.display_name,
            username: row.username || null,
            profileUrl: row.profile_url || null,
            status: row.status || 'in_review',
            isFlagged: row.is_flagged || false,
            modelTypes: row.model_types || [],
            modellingType: row.modelling_type || [],
            isAi: row.is_ai || false,
            aiModelId: row.ai_model_id || null,
            profileImageUrl: row.profile_image_url || null,
            videoUrl: row.video_url || null,
            galleryImageUrls: row.gallery_image_urls || [],
            description: row.description || null,
            styleTags: row.style_tags || [],
            canBook: row.can_book || false,
            bookUrl: row.book_url || null,
            canTravel: row.can_travel || false,
            hourlyRate: row.hourly_rate ?? null,
            halfDayRate: row.half_day_rate ?? null,
            fullDayRate: row.full_day_rate ?? null,
            currency: row.currency || 'GBP',
            elite: row.elite || false,
            eliteExpDate: row.elite_exp_date || null,
            pricePerImage: row.price_per_image ?? null,
            pricePerVideo: row.price_per_video ?? null,
            royaltySplitPercent: row.royalty_split_percent ?? null,
            licenseTerms: row.license_terms || null,
            usageRights: row.usage_rights || null,
            monthlyTarget: row.monthly_target ?? null,
            socialLinks: row.social_links || [],
            locations: row.locations || [],
            trainingData: row.training_data || [],
            accountType: row.account_type || 'both',
            modelType: row.model_type || 'both',
            isElite: row.is_elite || false,
            aiGenerationCost: row.ai_generation_cost ?? 5,
            realBookingCost: row.real_booking_cost ?? 1000,
            contentPreferences: row.content_preferences || [],
            location: row.location || null,
            gender: row.gender || null,
            ethnicity: row.ethnicity || null,
            bodyType: row.body_type || null,
            ageRange: row.age_range || null,
            createdByUserId: row.created_by_user_id || null,
            createdAt: row.created_at ? new Date(row.created_at) : new Date(),
            updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
        };

        return Model.create(props, row.model_id);
    }

    /**
     * Convert Model entity to database row
     * @param {Model} model - Model entity
     * @returns {Object} Database row for models table
     */
    static toDatabase(model) {
        return {
            model_id: model.id,
            display_name: model.displayName,
            username: model.username,
            profile_url: model.profileUrl,
            status: model.status,
            is_flagged: model.isFlagged,
            model_types: model.modelTypes,
            modelling_type: model.modellingType,
            is_ai: model.isAi,
            ai_model_id: model.aiModelId,
            profile_image_url: model.profileImageUrl,
            video_url: model.videoUrl,
            gallery_image_urls: model.galleryImageUrls,
            description: model.description,
            style_tags: model.styleTags,
            can_book: model.canBook,
            book_url: model.bookUrl,
            can_travel: model.canTravel,
            hourly_rate: model.hourlyRate,
            half_day_rate: model.halfDayRate,
            full_day_rate: model.fullDayRate,
            currency: model.currency,
            elite: model.elite,
            elite_exp_date: model.eliteExpDate,
            price_per_image: model.pricePerImage,
            price_per_video: model.pricePerVideo,
            royalty_split_percent: model.royaltySplitPercent,
            license_terms: model.licenseTerms,
            usage_rights: model.usageRights,
            monthly_target: model.monthlyTarget,
            social_links: model.socialLinks,
            locations: model.locations,
            training_data: model.trainingData,
            account_type: model.accountType,
            model_type: model.modelType,
            is_elite: model.isElite,
            ai_generation_cost: model.aiGenerationCost,
            real_booking_cost: model.realBookingCost,
            content_preferences: model.contentPreferences,
            location: model.location,
            gender: model.gender,
            ethnicity: model.ethnicity,
            body_type: model.bodyType,
            age_range: model.ageRange,
            created_by_user_id: model.createdByUserId || null,
            updated_at: new Date().toISOString(),
        };
    }

    /**
     * Convert database row to DTO
     * @param {Object} row - Database row
     * @returns {Object} DTO object
     */
    static toDTO(row) {
        if (!row) return null;

        return {
            id: row.model_id,
            displayName: row.display_name,
            username: row.username,
            profileUrl: row.profile_url,
            status: row.status,
            isFlagged: row.is_flagged,
            modelTypes: row.model_types || [],
            modellingType: row.modelling_type || [],
            isAi: row.is_ai,
            aiModelId: row.ai_model_id,
            profileImageUrl: row.profile_image_url,
            videoUrl: row.video_url,
            galleryImageUrls: row.gallery_image_urls || [],
            description: row.description,
            styleTags: row.style_tags || [],
            canBook: row.can_book,
            bookUrl: row.book_url,
            canTravel: row.can_travel,
            hourlyRate: row.hourly_rate,
            halfDayRate: row.half_day_rate,
            fullDayRate: row.full_day_rate,
            currency: row.currency,
            elite: row.elite,
            eliteExpDate: row.elite_exp_date,
            pricePerImage: row.price_per_image,
            pricePerVideo: row.price_per_video,
            royaltySplitPercent: row.royalty_split_percent,
            licenseTerms: row.license_terms,
            usageRights: row.usage_rights,
            monthlyTarget: row.monthly_target,
            socialLinks: row.social_links || [],
            locations: row.locations || [],
            trainingData: row.training_data || [],
            accountType: row.account_type || 'both',
            modelType: row.model_type || 'both',
            isElite: row.is_elite || false,
            aiGenerationCost: row.ai_generation_cost ?? 5,
            realBookingCost: row.real_booking_cost ?? 1000,
            contentPreferences: row.content_preferences || [],
            location: row.location || null,
            gender: row.gender,
            ethnicity: row.ethnicity,
            bodyType: row.body_type,
            ageRange: row.age_range,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
}
