import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: 'db.xwsflaeakjdnzyvlzknm.supabase.co',
  port: 5432,
  user: 'postgres',
  password: 'P@rthib@n1008',
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await client.connect();
  console.log('Connected to Supabase.');

  // Drop phone unique constraint to allow shared phone numbers
  await client.query('ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_phone_key;');

  // Delete old profiles
  await client.query('DELETE FROM public.profiles;');

  // Insert the 4 requested staff members
  await client.query(`
    INSERT INTO public.profiles (full_name, phone, role, is_active)
    VALUES 
      ('Viswanathan R', '9488782488', 'admin', true),
      ('Sridhar V', '8531859560', 'staff', true),
      ('Parthiban V', '8637406716', 'staff', true),
      ('Janaki V', '8637406716', 'staff', true);
  `);

  const res = await client.query('SELECT id, full_name, phone, role, is_active FROM public.profiles ORDER BY role, full_name;');
  console.log('✅ Updated profiles in Supabase:');
  console.table(res.rows);

  await client.end();
}

run();
