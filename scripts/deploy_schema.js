import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';

const { Client } = pg;

// Connect using direct credentials
const client = new Client({
  host: 'db.xwsflaeakjdnzyvlzknm.supabase.co',
  port: 5432,
  user: 'postgres',
  password: 'P@rthib@n1008',
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});

async function run() {
  console.log('Connecting to Supabase PostgreSQL at db.xwsflaeakjdnzyvlzknm.supabase.co...');
  try {
    await client.connect();
    console.log('✅ Connected successfully to Supabase PostgreSQL!');

    const sqlPath = path.resolve('supabase/migrations/20261116000000_initial_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing database schema & RPC creation...');
    await client.query(sql);
    console.log('✅ All tables, triggers, and RPC functions created successfully!');

    // Initialize business settings if not present
    const checkSettings = await client.query('SELECT count(*) FROM public.business_settings');
    if (parseInt(checkSettings.rows[0].count, 10) === 0) {
      console.log('Seeding official Kalaiselvi Nursery Garden settings...');
      await client.query(`
        INSERT INTO public.business_settings (
          business_name,
          business_name_tamil,
          address,
          phones,
          retail_bill_prefix,
          function_bill_prefix,
          next_retail_seq,
          next_function_seq,
          bill_footer_tamil,
          bill_footer_english
        ) VALUES (
          'Kalaiselvi Nursery Garden',
          'கலைச்செல்வி நர்சரி கார்டன்',
          'Mailam Road, Kutteripattu, Tindivanam Taluk, Villupuram, Tamil Nadu 604304',
          ARRAY['9488782488', '8531859560', '8637406716'],
          'KNG-RET',
          'KNG-FNC',
          1,
          1,
          'எங்களை தேர்ந்தெடுத்ததற்கு நன்றி! மீண்டும் வருக! 🌱',
          'Thank you for choosing Kalaiselvi Nursery Garden! 🌱'
        );
      `);
      console.log('✅ Business settings initialized with 0 dummy bills/customers.');
    }

    // Check tables
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('Tables present in Supabase public schema:');
    tablesRes.rows.forEach(r => console.log(' - ' + r.table_name));

  } catch (err) {
    console.error('❌ Database error:', err);
  } finally {
    await client.end();
  }
}

run();
