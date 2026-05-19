import pg from 'pg';
const { Client } = pg;

async function test(label, config) {
  const c = new Client({ ...config, connectionTimeoutMillis: 15000 });
  try {
    await c.connect();
    console.log(`${label}: CONNECTED`);
    const r = await c.query('SELECT current_database() as db');
    console.log(`${label}: QUERY OK`, r.rows[0]);
    await c.end();
    return true;
  } catch (e) {
    console.log(`${label}: ERROR`, e.code, e.message);
    try { await c.end(); } catch (x) {}
    return false;
  }
}

// Test pooler session mode (port 5432) with SSL
await test('Pooler session:5432 SSL', {
  host: 'aws-0-eu-central-1.pooler.supabase.com',
  port: 5432,
  user: 'postgres.tmivtbessykjksntdcwl',
  password: 'Core_128500!',
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});

// Test pooler transaction mode (port 6543) with SSL
await test('Pooler transaction:6543 SSL', {
  host: 'aws-0-eu-central-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.tmivtbessykjksntdcwl',
  password: 'Core_128500!',
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});

console.log('---');
console.log('All tests done');