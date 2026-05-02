import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
    const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .or('is_public.eq.true,prompt_type.in.(system,platform_default)');
    
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Success, rows found:', data.length);
        console.log('First row:', data[0]);
    }
}

test();
