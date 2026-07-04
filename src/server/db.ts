/**
 * Database Connection & Drizzle ORM Instance
 * 
 * Connects to PostgreSQL using the DATABASE_URL environment variable.
 * Exports the Drizzle db instance for use across the application.
 * 
 * RESILIENCE: Does NOT throw on missing DATABASE_URL at import time.
 * Instead, the server starts and API routes return proper JSON errors.
 */
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';

const { Pool } = pg;

// Track whether DB is available (used by routes to fail gracefully)
export let isDatabaseAvailable = false;

// Create PostgreSQL connection pool (or null if DATABASE_URL missing)
let _pool: pg.Pool | null = null;

if (process.env.DATABASE_URL) {
  _pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20, // Maximum number of connections in the pool
    idleTimeoutMillis: 30000, // Close idle connections after 30s
    connectionTimeoutMillis: 10000, // Timeout after 10s if unable to connect
    ssl: process.env.DATABASE_URL.includes('sslmode=require') ||
         process.env.DATABASE_URL.includes('railway.app') ||
         process.env.DATABASE_URL.includes('neon.tech') ||
         process.env.DATABASE_URL.includes('supabase.co') ||
         process.env.DATABASE_URL.includes('supabase.com')
      ? { rejectUnauthorized: false }
      : undefined,
  });

  // Handle pool errors gracefully (don't crash the process)
  _pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL pool error:', err.message);
    isDatabaseAvailable = false;
  });
} else {
  console.error(
    '⚠️  WARNING: DATABASE_URL environment variable is not set.\n' +
    '   The server will start, but all database operations will fail.\n' +
    '   Please set DATABASE_URL in your .env file:\n' +
    '   DATABASE_URL="postgresql://user:password@host:5432/quickvet"'
  );
}

// Export pool (may be null)
export const pool = _pool!;

// Create Drizzle ORM instance with schema for relational queries
// If pool is null, we create a dummy — routes must check isDatabaseAvailable first
export const db = _pool
  ? drizzle(_pool, { schema })
  : (null as unknown as ReturnType<typeof drizzle>);

/**
 * Utility: Test the database connection on startup.
 * Returns true if connected successfully, false otherwise.
 * Also sets the isDatabaseAvailable flag.
 */
export async function testConnection(): Promise<boolean> {
  if (!_pool) {
    console.error('❌ Cannot test connection: DATABASE_URL is not configured.');
    isDatabaseAvailable = false;
    return false;
  }

  try {
    const client = await _pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ PostgreSQL database connected successfully.');
    isDatabaseAvailable = true;
    return true;
  } catch (err: any) {
    console.error('❌ PostgreSQL connection failed:', err.message || err);
    console.error('   Connection string host:', process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'unknown');
    isDatabaseAvailable = false;
    return false;
  }
}

/**
 * Utility: Gracefully shut down the database pool.
 * Call this on server shutdown (SIGINT/SIGTERM).
 */
export async function closePool(): Promise<void> {
  if (_pool) {
    await _pool.end();
    console.log('Database pool closed.');
  }
}
