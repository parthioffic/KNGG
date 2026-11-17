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
  console.log('Connected to Supabase PostgreSQL.');

  // 1. Drop foreign key constraint on profiles.id if it exists
  console.log('Adjusting profiles.id default and foreign key...');
  await client.query(`
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
    ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();
  `);

  // 2. Grant permissions to anon and authenticated roles
  console.log('Granting table & sequence permissions to anon, authenticated, and service_role...');
  await client.query(`
    GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
    GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
  `);

  // 3. Clear any dummy data
  console.log('Ensuring all transactional tables are completely clean (0 dummy data)...');
  await client.query(`
    TRUNCATE TABLE public.payments CASCADE;
    TRUNCATE TABLE public.stock_movements CASCADE;
    TRUNCATE TABLE public.bill_items CASCADE;
    TRUNCATE TABLE public.bills CASCADE;
    TRUNCATE TABLE public.customers CASCADE;
  `);

  // 4. Reset sequences in business_settings
  await client.query(`
    UPDATE public.business_settings
    SET next_retail_seq = 1,
        next_function_seq = 1;
  `);

  // 5. Seed official staff accounts
  console.log('Inserting official Kalaiselvi Nursery Garden staff profiles...');
  await client.query(`
    DELETE FROM public.profiles;
    INSERT INTO public.profiles (full_name, phone, role, is_active)
    VALUES 
      ('Senthamizh K', '9488782488', 'admin', true),
      ('Murugan R', '8531859560', 'staff', true),
      ('Anbarasan S', '8637406716', 'staff', true);
  `);

  // 6. Check counts
  const profileCount = await client.query('SELECT count(*) FROM public.profiles');
  const custCount = await client.query('SELECT count(*) FROM public.customers');
  const billCount = await client.query('SELECT count(*) FROM public.bills');
  const payCount = await client.query('SELECT count(*) FROM public.payments');
  const plantCount = await client.query('SELECT count(*) FROM public.plants');

  console.log('Current Database State:');
  console.log(` - Profiles: ${profileCount.rows[0].count}`);
  console.log(` - Customers: ${custCount.rows[0].count} (Clean)`);
  console.log(` - Bills: ${billCount.rows[0].count} (Clean)`);
  console.log(` - Payments: ${payCount.rows[0].count} (Clean)`);
  console.log(` - Plants: ${plantCount.rows[0].count}`);

  await client.end();
  console.log('✅ Supabase database configured & cleaned successfully!');
}

run();
