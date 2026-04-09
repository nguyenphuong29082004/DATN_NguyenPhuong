# Catwalk AI v3 - Agent Instructions

## Commands
- Dev: `npm run dev` (Vite dev server)
- Build: `npm run build`
- Lint: `npm run lint` (ESLint)
- Test all: `npm test` (Vitest)
- Test single: `npm test -- tests/unit/domain/User.test.js`
- Test UI: `npm run test:ui`
- Coverage: `npm run test:coverage`

## Architecture (Clean Architecture)
- **Domain** (`src/domain/`): Pure business logic entities (User, Generation, Campaign, AIModel, Collection, DesignerItem, CreditTransaction)
- **Application** (`src/application/`): Use cases orchestrate logic, DTOs transform data
- **Infrastructure** (`src/infrastructure/`): Supabase repositories, AI services, mappers
- **Interfaces** (`src/interfaces/`): Repository/service contracts
- **DI** (`src/di/container.js`): Dependency injection singleton
- **Presentation** (`src/hooks/`): React hooks integrate with use cases via React Query

## Code Style
- React 19 + Vite + Supabase + React Query
- ESLint: unused vars starting with uppercase/underscore are ignored
- Imports: Domain entities must not depend on external libs
- Naming: camelCase for functions/variables, PascalCase for classes/components
- Error handling: Entities throw domain errors, use cases catch and transform
- Testing: Unit tests for domain entities in `tests/unit/domain/`
- **Components**: ALWAYS check `src/components/` for existing common components before creating new ones. If reusable, create in common components folder

## Supabase Database Changes
**REQUIRED**: All database changes MUST create migration file `supabase/migrations/YYYYMMDDHHMMSS_description.sql` with up/down migrations. DO NOT change directly via Dashboard/MCP.
