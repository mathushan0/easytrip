import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { config } from '../config/index.js';

async function runMigrations() {
  console.log('Running database migrations...');

  const pool = new Pool({ connectionString: config.db.url });
  const db = drizzle(pool);

  await migrate(db, { migrationsFolder: './src/db/migrations' });

  await pool.end();
  console.log('Migrations complete.');
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
