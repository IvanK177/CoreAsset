import pg from 'pg';
const { Client } = pg;

async function test(label, config) {
  const c = new Client({ ...config, query_timeout: 30000 });
  try {
    await c.connect();
    console.log(`${label}: CONNECTED`);
    const r = await c.query('SELECT current_database() as db, current_user as usr');
    console.log(`${label}: QUERY OK`, r.rows[0]);
    await c.end();
    return true;
  } catch (e) {
    console.log(`${label}: ERROR`, e.message);
    try { await c.end(); } catch (x) {}
    return false;
  }
}

// Test 1: Transaction pooler via IP (port 6543)
await test('IP:6543 tx-pooler', {
  host: '3.65.151.229',
  port: 6543,
  user: 'postgres.tmivtbessykjksntdcwl',
  password: 'Core_128500!',
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});

console.log('---');

// Test 2: Session pooler via IP (port 5432)
await test('IP:5432 session-pooler', {
  host: '3.65.151.229',
  port: 5432,
  user: 'postgres.tmivtbessykjksntdcwl',
  password: 'Core_128500!',
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});

console.log('---');

// Test 3: Direct via IPv6 (port 5432) — if reachable
await test('IPv6:5432 direct', {
  host: '2a05:d014:128e:9500:60ea:983f:c98e:e9b7',
  port: 5432,
  user: 'postgres',
  password: 'Core_128500!',
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});