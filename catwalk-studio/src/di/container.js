/**
 * Dependency Injection Container
 * Central registry for creating and providing use case instances
 *
 * This container is responsible for:
 * 1. Instantiating repositories (Infrastructure layer)
 * 2. Wiring repositories into use cases (Application layer)
 * 3. Providing use case instances to the presentation layer (Hooks)
 *
 * This allows us to easily swap implementations (e.g., switch from Supabase to REST API)
 * without changing the Application or Presentation layers.
 */

// Repositories
import { UserRepository } from '../infrastructure/supabase/UserRepository';
import { CreditRepository } from '../infrastructure/supabase/CreditRepository';
import { AIModelRepository } from '../infrastructure/supabase/AIModelRepository';
import { ModelRepository } from '../infrastructure/supabase/ModelRepository';
import { GenerationRepository } from '../infrastructure/supabase/GenerationRepository';
import { DesignerRepository } from '../infrastructure/supabase/DesignerRepository';
import { CampaignRepository } from '../infrastructure/supabase/CampaignRepository';
import { PromptRepository } from '../infrastructure/supabase/PromptRepository';
import { WardrobeRepository } from '../infrastructure/supabase/WardrobeRepository';
import { StorageService } from '../infrastructure/supabase/StorageService';

// Auth Use Cases
import { GetCurrentUserUseCase } from '../application/use-cases/auth/GetCurrentUserUseCase';
import { RegisterUserUseCase } from '../application/use-cases/auth/RegisterUserUseCase';
import { UpdateUserProfileUseCase } from '../application/use-cases/auth/UpdateUserProfileUseCase';

// Credit Use Cases
import { GetCreditBalanceUseCase } from '../application/use-cases/credits/GetCreditBalanceUseCase';
import { DeductCreditsUseCase } from '../application/use-cases/credits/DeductCreditsUseCase';
import { AddCreditsUseCase } from '../application/use-cases/credits/AddCreditsUseCase';
import { GetCreditHistoryUseCase } from '../application/use-cases/credits/GetCreditHistoryUseCase';

// Model Use Cases
import { CreateModelUseCase } from '../application/use-cases/models/CreateAIModelUseCase';
import { RegisterModelUseCase } from '../application/use-cases/models/RegisterModelUseCase';
import { GetUserModelsUseCase } from '../application/use-cases/models/GetUserModelsUseCase';
import { GetPublicModelsUseCase } from '../application/use-cases/models/GetPublicModelsUseCase';
import { UpdateModelVisibilityUseCase } from '../application/use-cases/models/UpdateModelVisibilityUseCase';
import { GetModelByUsernameUseCase } from '../application/use-cases/models/GetModelByUsernameUseCase';
import { GetShootableModelsUseCase } from '../application/use-cases/models/GetShootableModelsUseCase';
import { GetAIEnginesUseCase } from '../application/use-cases/models/GetAIEnginesUseCase';
import { GetUserAICharactersUseCase } from '../application/use-cases/models/GetUserAICharactersUseCase';
import { UpdateModelBioUseCase } from '../application/use-cases/models/UpdateModelBioUseCase';

// Generation Use Cases
import { GenerateQuickShootUseCase } from '../application/use-cases/generations/GenerateQuickShootUseCase';
import { GetGenerationHistoryUseCase } from '../application/use-cases/generations/GetGenerationHistoryUseCase';
import { PublishToGalleryUseCase } from '../application/use-cases/generations/PublishToGalleryUseCase';
import { DeleteGenerationUseCase } from '../application/use-cases/generations/DeleteGenerationUseCase';
import { GenerateAIModelUseCase } from '../application/use-cases/generations/GenerateAIModelUseCase';
import { InvokeQuickShootUseCase } from '../application/use-cases/generations/InvokeQuickShootUseCase';
import { InvokeTryOnUseCase } from '../application/use-cases/generations/InvokeTryOnUseCase';
import { AddToGalleryUseCase } from '../application/use-cases/generations/AddToGalleryUseCase';
import { GetGenerationStatusUseCase } from '../application/use-cases/generations/GetGenerationStatusUseCase';
import { SaveGenerationUseCase } from '../application/use-cases/generations/SaveGenerationUseCase';

// Designer Use Cases
import { CreateCollectionUseCase } from '../application/use-cases/designer/CreateCollectionUseCase';
import { CreateDesignerItemUseCase } from '../application/use-cases/designer/CreateDesignerItemUseCase';
import { GetUserCollectionsUseCase } from '../application/use-cases/designer/GetUserCollectionsUseCase';
import { GetWardrobeItemsUseCase } from '../application/use-cases/designer/GetWardrobeItemsUseCase';
import { DeleteCollectionUseCase } from '../application/use-cases/designer/DeleteCollectionUseCase';
import { AddItemToCollectionUseCase } from '../application/use-cases/designer/AddItemToCollectionUseCase';

// Campaign Use Cases
import { CreateCampaignUseCase } from '../application/use-cases/campaigns/CreateCampaignUseCase';
import { GetUserCampaignsUseCase } from '../application/use-cases/campaigns/GetUserCampaignsUseCase';
import { ArchiveCampaignUseCase } from '../application/use-cases/campaigns/ArchiveCampaignUseCase';
import { DeleteCampaignUseCase } from '../application/use-cases/campaigns/DeleteCampaignUseCase';

// Prompt Use Cases
import { GetUserPromptsUseCase } from '../application/use-cases/prompts/GetUserPromptsUseCase';
import { CreatePromptUseCase } from '../application/use-cases/prompts/CreatePromptUseCase';
import { UpdatePromptUseCase } from '../application/use-cases/prompts/UpdatePromptUseCase';
import { DeletePromptUseCase } from '../application/use-cases/prompts/DeletePromptUseCase';
import { GetPublicPromptsUseCase } from '../application/use-cases/prompts/GetPublicPromptsUseCase';

// Wardrobe Use Cases
import { GetUserWardrobeItemsUseCase } from '../application/use-cases/wardrobe/GetUserWardrobeItemsUseCase';
import { GetPublicWardrobeItemsUseCase } from '../application/use-cases/wardrobe/GetPublicWardrobeItemsUseCase';
import { CreateWardrobeItemUseCase } from '../application/use-cases/wardrobe/CreateWardrobeItemUseCase';
import { DeleteWardrobeItemUseCase } from '../application/use-cases/wardrobe/DeleteWardrobeItemUseCase';

// Gallery Use Cases
import { GetGalleryGenerationsUseCase } from '../application/use-cases/gallery/GetGalleryGenerationsUseCase';
import { LikeGenerationUseCase } from '../application/use-cases/gallery/LikeGenerationUseCase';
import { LikeAIModelUseCase } from '../application/use-cases/gallery/LikeAIModelUseCase';
import { GetGalleryItemUseCase } from '../application/use-cases/gallery/GetGalleryItemUseCase';
import { GetGalleryItemsUseCase } from '../application/use-cases/gallery/GetGalleryItemsUseCase';
import { LikeGalleryItemUseCase } from '../application/use-cases/gallery/LikeGalleryItemUseCase';
import { GetUserGalleryLikesUseCase } from '../application/use-cases/gallery/GetUserGalleryLikesUseCase';

// Booking & Report
import { BookingRepository } from '../infrastructure/supabase/BookingRepository';
import { ReportRepository } from '../infrastructure/supabase/ReportRepository';
import { CreateBookingUseCase } from '../application/use-cases/bookings/CreateBookingUseCase';
import { GetModelBookingsUseCase } from '../application/use-cases/bookings/GetModelBookingsUseCase';
import { GetBrandBookingsUseCase } from '../application/use-cases/bookings/GetBrandBookingsUseCase';
import { UpdateBookingStatusUseCase } from '../application/use-cases/bookings/UpdateBookingStatusUseCase';
import { CreateReportUseCase } from '../application/use-cases/reports/CreateReportUseCase';

// AI Service
import { ReplicateAIService } from '../infrastructure/ai-services/ReplicateAIService';
import { getSupabaseClient } from '../infrastructure/supabase/supabase.client';

/**
 * DI Container class
 */
class DIContainer {
    // ========================================================
    // Repository Getters (Infrastructure Layer)
    // ========================================================

    static getUserRepository() {
        if (!this._userRepository) {
            this._userRepository = new UserRepository();
        }
        return this._userRepository;
    }

    static getCreditRepository() {
        if (!this._creditRepository) {
            this._creditRepository = new CreditRepository();
        }
        return this._creditRepository;
    }

    static getAIModelRepository() {
        if (!this._aiModelRepository) {
            this._aiModelRepository = new AIModelRepository();
        }
        return this._aiModelRepository;
    }

    static getModelRepository() {
        if (!this._modelRepository) {
            this._modelRepository = new ModelRepository();
        }
        return this._modelRepository;
    }

    static getGenerationRepository() {
        if (!this._generationRepository) {
            this._generationRepository = new GenerationRepository();
        }
        return this._generationRepository;
    }

    static getDesignerRepository() {
        if (!this._designerRepository) {
            this._designerRepository = new DesignerRepository();
        }
        return this._designerRepository;
    }

    static getCampaignRepository() {
        if (!this._campaignRepository) {
            this._campaignRepository = new CampaignRepository();
        }
        return this._campaignRepository;
    }

    static getPromptRepository() {
        if (!this._promptRepository) {
            this._promptRepository = new PromptRepository();
        }
        return this._promptRepository;
    }

    static getWardrobeRepository() {
        if (!this._wardrobeRepository) {
            this._wardrobeRepository = new WardrobeRepository();
        }
        return this._wardrobeRepository;
    }

    static getBookingRepository() {
        if (!this._bookingRepository) {
            this._bookingRepository = new BookingRepository();
        }
        return this._bookingRepository;
    }

    static getReportRepository() {
        if (!this._reportRepository) {
            this._reportRepository = new ReportRepository();
        }
        return this._reportRepository;
    }

    // ========================================================
    // Services
    // ========================================================

    static getAIService() {
        if (!this._aiService) {
            this._aiService = new ReplicateAIService();
        }
        return this._aiService;
    }

    // ========================================================
    // Service Getters (Infrastructure Layer)
    // ========================================================

    static getStorageService() {
        return new StorageService('media');
    }

    // ========================================================
    // Use Case Getters (Application Layer)
    // ========================================================

    // Auth Use Cases
    static getCurrentUserUseCase() {
        return new GetCurrentUserUseCase(this.getUserRepository());
    }

    static getRegisterUserUseCase() {
        return new RegisterUserUseCase(this.getUserRepository());
    }

    static getUpdateUserProfileUseCase() {
        return new UpdateUserProfileUseCase(this.getUserRepository());
    }

    // Credit Use Cases
    static getCreditBalanceUseCase() {
        return new GetCreditBalanceUseCase(this.getUserRepository());
    }

    static getDeductCreditsUseCase() {
        return new DeductCreditsUseCase(this.getUserRepository(), this.getCreditRepository());
    }

    static getAddCreditsUseCase() {
        return new AddCreditsUseCase(this.getUserRepository(), this.getCreditRepository());
    }

    static getCreditHistoryUseCase() {
        return new GetCreditHistoryUseCase(this.getCreditRepository());
    }

    // Model Use Cases (Fashion Models — uses ModelRepository → models table)
    static getCreateModelUseCase() {
        return new CreateModelUseCase(this.getModelRepository());
    }

    static getRegisterModelUseCase() {
        return new RegisterModelUseCase(this.getModelRepository(), this.getUserRepository(), getSupabaseClient());
    }

    static getPublicModelsUseCase() {
        return new GetPublicModelsUseCase(this.getModelRepository());
    }

    static getModelByUsernameUseCase() {
        return new GetModelByUsernameUseCase(this.getModelRepository());
    }

    static getUpdateModelBioUseCase() {
        return new UpdateModelBioUseCase(getSupabaseClient());
    }

    static getShootableModelsUseCase() {
        return new GetShootableModelsUseCase(this.getModelRepository());
    }

    static getAIEnginesUseCase() {
        return new GetAIEnginesUseCase(this.getModelRepository());
    }

    static getUserAICharactersUseCase() {
        return new GetUserAICharactersUseCase(this.getAIModelRepository());
    }

    // Legacy — kept for backward compatibility until fully migrated
    static getCreateAIModelUseCase() {
        return new CreateModelUseCase(this.getModelRepository());
    }

    static getUserModelsUseCase() {
        return new GetUserModelsUseCase(this.getAIModelRepository());
    }

    static getUpdateModelVisibilityUseCase() {
        return new UpdateModelVisibilityUseCase(this.getAIModelRepository());
    }

    // Generation Use Cases
    static getGenerateQuickShootUseCase() {
        return new GenerateQuickShootUseCase(
            this.getGenerationRepository(),
            this.getDeductCreditsUseCase(),
            this.getAIModelRepository(),
            this.getAIService()
        );
    }

    static getGenerationHistoryUseCase() {
        return new GetGenerationHistoryUseCase(this.getGenerationRepository());
    }

    static getPublishToGalleryUseCase() {
        return new PublishToGalleryUseCase(this.getGenerationRepository());
    }

    static getDeleteGenerationUseCase() {
        return new DeleteGenerationUseCase(this.getGenerationRepository(), this.getAIModelRepository());
    }

    static getGenerateAIModelUseCase() {
        return new GenerateAIModelUseCase(this.getGenerationRepository());
    }

    static getInvokeQuickShootUseCase() {
        return new InvokeQuickShootUseCase(this.getGenerationRepository());
    }

    static getInvokeTryOnUseCase() {
        return new InvokeTryOnUseCase(this.getGenerationRepository());
    }

    static getAddToGalleryUseCase() {
        return new AddToGalleryUseCase(this.getGenerationRepository());
    }

    static getGenerationStatusUseCase() {
        return new GetGenerationStatusUseCase(this.getGenerationRepository());
    }

    static getSaveGenerationUseCase() {
        return new SaveGenerationUseCase(this.getGenerationRepository());
    }

    // Designer Use Cases
    static getCreateCollectionUseCase() {
        return new CreateCollectionUseCase(this.getDesignerRepository());
    }

    static getCreateDesignerItemUseCase() {
        return new CreateDesignerItemUseCase(this.getDesignerRepository(), this.getWardrobeRepository());
    }

    static getUserCollectionsUseCase() {
        return new GetUserCollectionsUseCase(this.getDesignerRepository());
    }

    static getWardrobeItemsUseCase() {
        return new GetWardrobeItemsUseCase(this.getDesignerRepository());
    }

    static getDeleteCollectionUseCase() {
        return new DeleteCollectionUseCase(this.getDesignerRepository());
    }

    static getAddItemToCollectionUseCase() {
        return new AddItemToCollectionUseCase(this.getDesignerRepository());
    }

    // Campaign Use Cases
    static getCreateCampaignUseCase() {
        return new CreateCampaignUseCase(this.getCampaignRepository());
    }

    static getUserCampaignsUseCase() {
        return new GetUserCampaignsUseCase(this.getCampaignRepository());
    }

    static getArchiveCampaignUseCase() {
        return new ArchiveCampaignUseCase(this.getCampaignRepository());
    }

    static getDeleteCampaignUseCase() {
        return new DeleteCampaignUseCase(this.getCampaignRepository(), this.getGenerationRepository());
    }

    // Prompt Use Cases
    static getUserPromptsUseCase() {
        return new GetUserPromptsUseCase(this.getPromptRepository());
    }

    static getPublicPromptsUseCase() {
        return new GetPublicPromptsUseCase(this.getPromptRepository());
    }

    static getCreatePromptUseCase() {
        return new CreatePromptUseCase(this.getPromptRepository());
    }

    static getUpdatePromptUseCase() {
        return new UpdatePromptUseCase(this.getPromptRepository());
    }

    static getDeletePromptUseCase() {
        return new DeletePromptUseCase(this.getPromptRepository());
    }

    // Wardrobe Use Cases
    static getUserWardrobeItemsUseCase() {
        return new GetUserWardrobeItemsUseCase(this.getWardrobeRepository());
    }

    static getPublicWardrobeItemsUseCase() {
        return new GetPublicWardrobeItemsUseCase(this.getWardrobeRepository());
    }

    static getCreateWardrobeItemUseCase() {
        return new CreateWardrobeItemUseCase(this.getWardrobeRepository());
    }

    static getDeleteWardrobeItemUseCase() {
        return new DeleteWardrobeItemUseCase(this.getWardrobeRepository());
    }

    // Gallery Use Cases
    static getGalleryGenerationsUseCase() {
        return new GetGalleryGenerationsUseCase(this.getGenerationRepository());
    }

    static getLikeGenerationUseCase() {
        return new LikeGenerationUseCase(this.getGenerationRepository());
    }

    static getLikeAIModelUseCase() {
        return new LikeAIModelUseCase(this.getAIModelRepository());
    }

    static getGalleryItemUseCase() {
        return new GetGalleryItemUseCase(this.getGenerationRepository());
    }

    static getGalleryItemsUseCase() {
        return new GetGalleryItemsUseCase(this.getGenerationRepository());
    }

    static getLikeGalleryItemUseCase() {
        return new LikeGalleryItemUseCase(this.getGenerationRepository());
    }

    static getUserGalleryLikesUseCase() {
        return new GetUserGalleryLikesUseCase(this.getGenerationRepository());
    }

    // Booking Use Cases
    static getCreateBookingUseCase() {
        return new CreateBookingUseCase(this.getBookingRepository());
    }

    static getGetModelBookingsUseCase() {
        return new GetModelBookingsUseCase(this.getBookingRepository());
    }

    static getGetBrandBookingsUseCase() {
        return new GetBrandBookingsUseCase(this.getBookingRepository());
    }

    static getUpdateBookingStatusUseCase() {
        return new UpdateBookingStatusUseCase(this.getBookingRepository());
    }

    // Report Use Cases
    static getCreateReportUseCase() {
        return new CreateReportUseCase(this.getReportRepository());
    }
}

/**
 * Reset all repository singletons (useful for testing)
 */
export function resetRepositories() {
    DIContainer._userRepository = null;
    DIContainer._creditRepository = null;
    DIContainer._aiModelRepository = null;
    DIContainer._modelRepository = null;
    DIContainer._generationRepository = null;
    DIContainer._designerRepository = null;
    DIContainer._campaignRepository = null;
    DIContainer._promptRepository = null;
    DIContainer._wardrobeRepository = null;
    DIContainer._bookingRepository = null;
    DIContainer._reportRepository = null;
    DIContainer._aiService = null;
}

// Export class as singleton (all methods are static)
const container = DIContainer;

export { container };
export default container;
