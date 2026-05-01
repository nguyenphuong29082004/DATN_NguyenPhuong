import { container } from '../src/di/container.js';
import { Model } from '../src/domain/entities/Model.js';

async function seedModels() {
    console.log('Seeding models...');
    const repo = container.getModelRepository();

    const mockModels = [
        new Model({
            username: 'elara_vanguard',
            displayName: 'Elara Vanguard',
            profileUrl: 'elara_vanguard',
            status: 'active',
            isAi: true,
            profileImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
            styleTags: ['editorial', 'avant-garde', 'high-fashion'],
            canBook: true,
            location: 'London, UK',
            pricePerImage: 15.00,
            hourlyRate: 150.00,
            elite: true,
            accountType: 'both'
        }),
        new Model({
            username: 'jaxon_street',
            displayName: 'Jaxon Street',
            profileUrl: 'jaxon_street',
            status: 'active',
            isAi: true,
            profileImageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
            styleTags: ['streetwear', 'urban', 'commercial'],
            canBook: true,
            location: 'New York, USA',
            pricePerImage: 10.00,
            hourlyRate: 100.00,
            elite: false,
            accountType: 'ai_only'
        }),
        new Model({
            username: 'sophia_lorenzo',
            displayName: 'Sophia Lorenzo',
            profileUrl: 'sophia_lorenzo',
            status: 'active',
            isAi: false,
            profileImageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
            styleTags: ['runway', 'swimwear', 'commercial'],
            canBook: true,
            location: 'Milan, Italy',
            pricePerImage: 25.00,
            hourlyRate: 300.00,
            elite: true,
            accountType: 'real_only'
        }),
        new Model({
            username: 'chen_wei',
            displayName: 'Chen Wei',
            profileUrl: 'chen_wei',
            status: 'active',
            isAi: true,
            profileImageUrl: 'https://images.unsplash.com/photo-1542206395-9feb3edaa68d?auto=format&fit=crop&w=800&q=80',
            styleTags: ['minimalist', 'editorial', 'commercial'],
            canBook: true,
            location: 'Tokyo, Japan',
            pricePerImage: 12.00,
            hourlyRate: 120.00,
            elite: false,
            accountType: 'both'
        })
    ];

    for (const model of mockModels) {
        try {
            await repo.create(model);
            console.log(`Inserted model: ${model.displayName}`);
        } catch (err) {
            console.error(`Failed to insert ${model.displayName}:`, err.message);
        }
    }
    console.log('Seeding completed.');
}

seedModels().catch(console.error);
