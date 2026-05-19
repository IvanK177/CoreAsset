import pg from 'pg';
const { Client } = pg;

async function test(label, config) {
  const c = new Client({ ...config, query_timeout: 30000 });
  try {
    await c.connect();
    console.log(`${label}: CONNECTED`);
    // Use simple query protocol (no prepared statements) for PgBouncer compatibility
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

// Test: Transaction pooler via IP with statement_timeout to handle slow startup
await test('TX-pooler IP:6543 no-prepare', {
  host: '3.65.151.229',
  port: 6543,
  user: 'postgres.tmivtbessykjksntdcwl',
  password: 'Core_128500!',
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
  statement_timeout: 30000,
});

console.log('---');

// Test: Direct via IPv6 with longer timeout
await test('Direct IPv6:5432', {
  host: '2a05:d014:128e:9500:60ea:983f:c98e:e9b7',
  port: 5432,
  user: 'postgres',
  password: 'Core_128500!',
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
  statement_timeout: 30000,
});