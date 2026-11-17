import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xwsflaeakjdnzyvlzknm.supabase.co';
const supabaseAnonKey = 'sb_publishable_C7splD7IqEXjJr7aCMGk4g_UYJVuzq8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log('Testing Supabase JS Client connection...');
  
  // 1. Fetch profiles
  const { data: profiles, error: profErr } = await supabase.from('profiles').select('*');
  if (profErr) {
    console.error('❌ Error fetching profiles:', profErr);
  } else {
    console.log('✅ Fetched profiles via Supabase API:', profiles.length);
    profiles.forEach(p => console.log(`   - ${p.full_name} (${p.role}, ${p.phone})`));
  }

  // 2. Fetch business settings
  const { data: settings, error: setErr } = await supabase.from('business_settings').select('*');
  if (setErr) {
    console.error('❌ Error fetching business_settings:', setErr);
  } else {
    console.log('✅ Fetched settings via Supabase API:', settings[0]?.business_name);
  }

  // 3. Fetch customers (should be 0 clean)
  const { data: customers, error: custErr } = await supabase.from('customers').select('*');
  if (custErr) {
    console.error('❌ Error fetching customers:', custErr);
  } else {
    console.log('✅ Fetched customers count (should be 0 clean):', customers.length);
  }
}

test();
