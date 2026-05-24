import pg from 'pg';

const client = new pg.Client({
  connectionString: 'postgresql://postgres:Core_128500!@db.tmivtbessykjksntdcwl.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false },
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// Handle unexpected errors
client.on('error', (err) => {
  console.error('Client error (suppressed):', err.message);
});

async function main() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Check if old constraint still exists
    const r1 = await client.query("SELECT conname FROM pg_constraint WHERE conname = 'computers_serial_number_key'");
    console.log('Old constraint exists:', r1.rows.length > 0);

    // Check if new partial index exists
    const r2 = await client.query("SELECT indexname FROM pg_indexes WHERE indexname = 'computers_serial_number_non_null_key'");
    console.log('New partial index exists:', r2.rows.length > 0);

    // If old constraint still exists, drop it and create the partial index
    if (r1.rows.length > 0) {
      console.log('Dropping old constraint...');
      await client.query('ALTER TABLE computers DROP CONSTRAINT computers_serial_number_key');
      console.log('Old constraint dropped');
    }

    if (r2.rows.length === 0) {
      console.log('Creating partial unique index...');
      await client.query('CREATE UNIQUE INDEX computers_serial_number_non_null_key ON computers (serial_number) WHERE serial_number IS NOT NULL');
      console.log('Partial unique index created');
    }

    // Verify final state
    const r3 = await client.query("SELECT conname FROM pg_constraint WHERE conname = 'computers_serial_number_key'");
    const r4 = await client.query("SELECT indexname FROM pg_indexes WHERE indexname = 'computers_serial_number_non_null_key'");
    console.log('Final state - Old constraint exists:', r3.rows.length > 0);
    console.log('Final state - New partial index exists:', r4.rows.length > 0);

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    try { await client.end(); } catch (_) {}
    console.log('Done');
  }
}

main();