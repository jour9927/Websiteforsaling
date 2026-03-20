require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const email = 'test_player@eventglass.com';
  const password = 'password123';

  // Try to create or update user
  const { data: user, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error && error.message.includes('already exists')) {
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existing = existingUsers.users.find(u => u.email === email);
    if (existing) {
       await supabase.auth.admin.updateUserById(existing.id, { password });
       console.log('User password updated.');
    }
  } else if (!error) {
    console.log('Created user:', user.user.id);
  } else {
    console.error('Error:', error);
  }
}

main().catch(console.error);
