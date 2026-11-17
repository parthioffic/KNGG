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
  const users = await client.query('SELECT id, email, phone FROM auth.users');
  console.log('auth.users count:', users.rows.length);

  // If profiles references auth.users, check constraints
  const constraints = await client.query(`
    SELECT conname, pg_get_constraintdef(c.oid)
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE conrelid = 'public.profiles'::regclass;
  `);
  console.log('Profiles constraints:', constraints.rows);

  await client.end();
}

run();
