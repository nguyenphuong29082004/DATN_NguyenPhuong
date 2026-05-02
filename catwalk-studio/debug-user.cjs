const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://gyjmfealrjbiupyrgani.supabase.co';
const supabaseServiceKey = '9e91b79ab29958ff54d07538b5008297729af21346f1343d730edb524cd1dedb'; // I got this from secrets earlier

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUser() {
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
        console.error('Auth error:', authError);
        return;
    }
    
    console.log('Total Auth Users:', authUsers.users.length);
    
    const { data: publicUsers, error: publicError } = await supabase.from('users').select('*');
    if (publicError) {
        console.error('Public users error:', publicError);
        return;
    }
    
    console.log('Total Public Users:', publicUsers.length);
    
    if (publicUsers.length > 0) {
        console.log('Columns in public.users:', Object.keys(publicUsers[0]));
    }
}

checkUser();
