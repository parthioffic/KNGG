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

const PLANTS = [
  { name: 'Jasmine / Malligai', tamil_name: 'குண்டு மல்லி', category: 'Flowering Plants', price: 40.0, stock: 0 },
  { name: 'Red Hybrid Rose', tamil_name: 'சிகப்பு ரோஜா', category: 'Flowering Plants', price: 70.0, stock: 0 },
  { name: 'Red Hibiscus / Sembaruthi', tamil_name: 'செம்பருத்தி', category: 'Flowering Plants', price: 60.0, stock: 0 },
  { name: 'Banganapalli Mango Graft', tamil_name: 'பங்கனப்பள்ளி மாங்கன்று', category: 'Fruit Plants', price: 180.0, stock: 0 },
  { name: 'Taiwan Pink Guava', tamil_name: 'தைவான் கொய்யா', category: 'Fruit Plants', price: 120.0, stock: 0 },
  { name: 'Seedless Lemon / Elumichai', tamil_name: 'விதை இல்லா எலுமிச்சை', category: 'Fruit Plants', price: 90.0, stock: 0 },
  { name: 'Teak Tree Sapling', tamil_name: 'நாட்டு தேக்கு கன்று', category: 'Timber Trees', price: 55.0, stock: 0 },
  { name: 'Country Neem / Vembu', tamil_name: 'வேப்பங்கன்று', category: 'Timber Trees', price: 40.0, stock: 0 },
  { name: 'Golden Pothos / Money Plant', tamil_name: 'மணி பிளான்ட்', category: 'Indoor Plants', price: 150.0, stock: 0 },
  { name: 'Holy Basil / Thulasi', tamil_name: 'கருந்துளசி', category: 'Medicinal & Herbal', price: 25.0, stock: 0 },
  { name: 'Terracotta 10-inch Clay Pot', tamil_name: 'சுடுமண் தொட்டி 10 இன்ச்', category: 'Pots & Fertilizers', price: 85.0, stock: 0 },
  { name: 'Organic Vermicompost (5kg)', tamil_name: 'மண்புழு உரம் (5 கிலோ)', category: 'Pots & Fertilizers', price: 140.0, stock: 0 },
];

async function run() {
  await client.connect();
  console.log('Seeding official plant catalog into Supabase...');

  for (const p of PLANTS) {
    await client.query(`
      INSERT INTO public.plants (name, tamil_name, category, selling_price, current_stock, min_stock_alert, is_active)
      VALUES ($1, $2, $3, $4, $5, 10.0, true)
    `, [p.name, p.tamil_name, p.category, p.price, p.stock]);
  }

  const res = await client.query('SELECT count(*) FROM public.plants');
  console.log(`✅ Successfully seeded ${res.rows[0].count} plant varieties into Supabase (Stock: 0, ready for actual intake).`);
  await client.end();
}

run();
