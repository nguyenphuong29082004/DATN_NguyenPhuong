
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    globalThis.process.env.VITE_SUPABASE_URL,
    globalThis.process.env.VITE_SUPABASE_ANON_KEY
);

async function checkModels() {
    console.log('Checking models table...');
    const { data: models, error: modelsError } = await supabase
        .from('models')
        .select('model_id, id, display_name, status')
        .limit(5);

    if (modelsError) {
        console.error('Error fetching models:', modelsError);
    } else {
        console.log('Models found:', models.length);
        console.log(JSON.stringify(models, null, 2));
    }

    console.log('\nChecking aimodel_mapper table...');
    const { data: engines, error: enginesError } = await supabase
        .from('aimodel_mapper')
        .select('*')
        .limit(5);

    if (enginesError) {
        console.error('Error fetching engines:', enginesError);
    } else {
        console.log('Engines found:', engines.length);
        console.log(JSON.stringify(engines, null, 2));
    }
}

checkModels();
