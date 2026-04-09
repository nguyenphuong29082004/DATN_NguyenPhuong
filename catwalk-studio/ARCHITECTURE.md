# Catwalk Studio - Clean Architecture Implementation

## 🎯 Project Overview

Catwalk Studio has been successfully refactored to follow **Clean Architecture** principles, creating a maintainable, testable, and scalable codebase.

## 📐 Architecture Layers

### 1. Domain Layer (`src/domain/`)
**Pure business logic** - No external dependencies

**Entities** (8 total):
- `User.js` - User management, credits, subscriptions
- `CreditTransaction.js` - Transaction logging
- `AIModel.js` - AI model marketplace
- `Generation.js` - Image generation lifecycle
- `Collection.js` - Designer collections
- `DesignerItem.js` - Wardrobe items
- `Campaign.js` - Batch generation campaigns
- `Entity.js` - Base entity class

**Key Principle**: Entities contain ALL business rules and validation

### 2. Application Layer (`src/application/`)
**Use cases orchestrate business logic**

**DTOs** (`dto/`):
- `UserDTO.js`, `CreditDTO.js`, `AIModelDTO.js`
- `GenerationDTO.js`, `DesignerDTO.js`, `CampaignDTO.js`

**Use Cases** (`use-cases/`):
- **User**: Register, GetCurrentUser, UpdateProfile
- **Credits**: Deduct, Add, GetBalance, GetHistory
- **Models**: Create, GetUserModels, GetPublic, UpdateVisibility
- **Generations**: GenerateQuickShoot, GetHistory, Publish, Delete
- **Designer**: CreateCollection, CreateItem, GetCollections, GetWardrobe
- **Campaigns**: Create, GetUserCampaigns, Start
- **Gallery**: GetGalleryGenerations, LikeGeneration, LikeModel

**Total: 25+ use cases**

### 3. Interfaces Layer (`src/interfaces/`)
**Contracts for external systems**

**Repositories**:
- `IUserRepository`, `ICreditRepository`, `IAIModelRepository`
- `IGenerationRepository`, `IDesignerRepository`, `ICampaignRepository`

**Services**:
- `IAIService` - AI image generation interface

### 4. Infrastructure Layer (`src/infrastructure/`)
**External implementations**

**Supabase Repositories** (`supabase/`):
- `UserRepository`, `CreditRepository`, `AIModelRepository`
- `GenerationRepository`, `DesignerRepository`, `CampaignRepository`

**Mappers** (`supabase/mappers/`):
- Convert between database rows and domain entities
- Handle data transformation bidirectionally

**Services** (`ai-services/`):
- `MockAIService` - Development implementation
- Ready for real API swap (Replicate, Stability AI, etc.)

### 5. Dependency Injection (`src/di/`)
**Centralized dependency management**

`container.js`:
- Singleton pattern
- Lazy loading
- All dependencies wired
- Easy to swap implementations

### 6. Presentation Layer (`src/hooks/`)
**React integration with Clean Architecture**

**Hooks**:
- `useUserProfile.js` - User management
- `useCredits.js` - Credit operations
- `useAIModels.js` - AI model marketplace
- `useGenerations.js` - Image generation
- `useDesigner.js` - Collections & wardrobe
- `useCampaigns.js` - Batch campaigns
- `useGallery.js` - Public browsing

**Pattern**: All hooks use DI Container + React Query for caching

## 🔄 Data Flow Example

**Generate Image Flow**:
```
Component
  ↓ calls
useGenerateQuickShoot().generate()
  ↓ executes
GenerateQuickShootUseCase (orchestrator)
  ↓ validates & creates
Generation entity (pending, cost calculated)
  ↓ deducts via
DeductCreditsUseCase → User.deductCredits()
  ↓ logs
CreditTransaction via CreditRepository
  ↓ calls
MockAIService.generateImage()
  ↓ updates
generation.markAsCompleted(imageUrl)
  ↓ saves
GenerationRepository.save()
  ↓ tracks
model.incrementUsageCount()
  ↓ invalidates
React Query cache
  ↓ returns
{ generation, newBalance }
```

## 🎯 Key Benefits

### Testability
- **100+ unit tests** covering all domain logic
- Entities tested in isolation
- Use cases mockable
- No coupling to frameworks

### Maintainability
- Clear separation of concerns
- Easy to locate business rules
- Predictable code organization
- Self-documenting structure

### Flexibility
- Swap Supabase → PostgreSQL: Change repositories only
- Swap MockAI → Real API: Change service only
- Add new features: Follow established patterns
- Easy to extend

### Scalability
- Independent layers scale separately
- React Query handles caching
- Optimistic updates
- Batch operations support

## 📊 Project Statistics

| Metric | Count |
|--------|-------|
| **Domain Entities** | 8 |
| **Use Cases** | 25+ |
| **Repositories** | 6 |
| **DTOs** | 15+ |
| **Hooks** | 20+ |
| **Total Files Created** | ~60 |
| **Lines of Code** | ~10,000 |
| **Test Files** | 5 |
| **Test Cases** | 100+ |
| **Build Errors** | 0 ✅ |

## 🧪 Testing

### Run Tests
```bash
# All tests
npm test

# Watch mode
npm test -- --watch

# With UI
npm run test:ui

# Coverage report
npm run test:coverage
```

### Test Coverage
- ✅ All domain entities (User, Generation, Campaign, etc.)
- ✅ Business rule validation
- ✅ State transitions
- ✅ Access control
- ✅ Edge cases

## 🚀 Development Workflow

### Adding New Feature
1. **Domain**: Create entity with business logic
2. **Application**: Create DTOs and use cases
3. **Infrastructure**: Implement repository
4. **DI**: Wire dependencies in container
5. **Presentation**: Create React hooks
6. **Test**: Write unit tests

### Example: Add "Favorites" Feature
```javascript
// 1. Domain
class Favorite extends Entity {
  static create({ userId, itemId, itemType }) { /* ... */ }
}

// 2. Application
class AddToFavoritesUseCase extends UseCase {
  execute({ userId, itemId, itemType }) { /* ... */ }
}

// 3. Infrastructure
class FavoriteRepository extends IFavoriteRepository {
  async create(favorite) { /* ... */ }
}

// 4. DI
container.getFavoriteRepository()
container.getAddToFavoritesUseCase()

// 5. Presentation
export function useAddFavorite() {
  // React Query mutation
}
```

## 📚 Additional Resources

- **Implementation Plan**: See `implementation_plan.md`
- **Task Checklist**: See `task.md`
- **Walkthrough**: See `walkthrough.md`
- **Diagrams**: See `architecture_diagrams.md`

## ⚙️ Configuration

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Database Schema
Tables follow Clean Architecture:
- `profiles` (User data)
- `credit_transactions` (Transaction log)
- `ai_models` (AI models marketplace)
- `generations` (Image generations)
- `designer_collections` (Collections)
- `designer_items` (Wardrobe items)
- `campaigns` (Batch campaigns)

## 🎓 Clean Architecture Principles Applied

### ✅ Dependency Rule
- Outer layers depend on inner layers
- Domain has ZERO dependencies
- Entities know nothing about UI/DB

### ✅ Separation of Concerns
- Each layer has ONE responsibility
- Business logic ONLY in entities
- Use cases orchestrate
- Repositories abstract data access

### ✅ Testability
- All business logic unit testable
- No framework coupling
- Easy mocking

### ✅ Framework Independence
- Can swap React → Vue/Angular
- Can swap Supabase → PostgreSQL
- Can swap AI service anytime

## 🔮 Future Enhancements

### Potential Improvements
1. **Real AI Integration**: Swap MockAIService with Replicate/Stability AI
2. **Background Jobs**: Queue for batch campaign processing
3. **Caching Layer**: Redis for high-traffic endpoints
4. **Event Sourcing**: Track all state changes
5. **GraphQL**: Alternative API layer
6. **Microservices**: Split domains into services

### Easy to Add
- New payment providers (Stripe → PayPal)
- New storage backends (S3, Cloudflare R2)
- New auth providers (Google, GitHub)
- New notification channels (Email, SMS)

## ✅ Checklist for New Developers

- [ ] Read this ARCHITECTURE.md
- [ ] Review `implementation_plan.md`
- [ ] Explore domain entities in `src/domain/entities/`
- [ ] Check use case examples in `src/application/use-cases/`
- [ ] Run `npm test` to see tests
- [ ] Try `npm run dev` and test features
- [ ] Read `CONTRIBUTING.md` (if exists)

## 🎉 Conclusion

This Clean Architecture implementation provides a **solid foundation** for Catwalk Studio to grow. The codebase is now:

- ✅ **Maintainable** - Clear structure, easy to navigate
- ✅ **Testable** - 100+ unit tests, high coverage
- ✅ **Scalable** - Independent layers, easy to extend
- ✅ **Flexible** - Swap any external dependency
- ✅ **Professional** - Industry-standard patterns

**Total Transformation**: From tightly-coupled code to Clean Architecture! 🚀
