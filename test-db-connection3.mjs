import pg from 'pg';
const { Client } = pg;

async function test(label, config) {
  const c = new Client({ ...config, query_timeout: 30000 });
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

// Test 1: No SSL at all — see if Supabase rejects or accepts
await test('No-SSL pooler:6543', {
  host: '3.65.151.229',
  port: 6543,
  user: 'postgres.tmivtbessykjksntdcwl',
  password: 'Core_128500!',
  database: 'postgres',
  ssl: false,
});

console.log('---');

// Test 2: SSL with custom options — try min TLS version
await test('SSL-minTLS pooler:6543', {
  host: '3.65.151.229',
  port: 6543,
  user: 'postgres.tmivtbessykjksntdcwl',
  password: 'Core_128500!',
  database: 'postgres',
  ssl: { rejectUnauthorized: false, minVersion: 'TLSv1.2' },
});

console.log('---');

// Test 3: SSL with hostname verification (proper SNI)
await test('SSL-SNI pooler:6543', {
  host: 'aws-1-eu-central-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.tmivtbessykjksntdcwl',
  password: 'Core_128500!',
  database: 'postgres',
  ssl: { rejectUnauthorized: false, servername: 'aws-1-eu-central-1.pooler.supabase.com' },
});

console.log('---');

// Test 4: Direct IPv6 with SSL
await test('Direct IPv6:5432', {
  host: '2a05:d014:128e:9500:60ea:983f:c98e:e9b7',
  port: 5432,
  user: 'postgres',
  password: 'Core_128500!',
  database: 'postgres',
  ssl: { rejectUnauthorized: false, servername: 'db.tmivtbessykjksntdcwl.supabase.co' },
});