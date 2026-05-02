import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gyjmfealrjbiupyrgani.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5am1mZWFscmpiaXVweXJnYW5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1OTc2NTEsImV4cCI6MjA5MzE3MzY1MX0.Fy9su2KHm_kkSjXQ7cXyNO2c8Uvo4JWpS4rXC8ZM-jg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
    console.log('Testing with Anon Key...');
    const { data, error } = await supabase
        .from('prompts')
        .select('*');
    
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Rows found:', data.length);
    }
}

test();
