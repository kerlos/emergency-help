import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

// Set Node.js TLS rejection if DB_SSL_REJECT_UNAUTHORIZED is false
// This is a global Node.js setting that affects all TLS connections
if (process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.log('⚠️  NODE_TLS_REJECT_UNAUTHORIZED set to 0 (allows self-signed certs)');
}

// Debug: Log environment variables
console.log('Environment check:');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DB_SSL:', process.env.DB_SSL);
console.log('DB_SSL_REJECT_UNAUTHORIZED:', process.env.DB_SSL_REJECT_UNAUTHORIZED);
console.log('NODE_TLS_REJECT_UNAUTHORIZED:', process.env.NODE_TLS_REJECT_UNAUTHORIZED);

// SSL configuration helper
const getSslConfig = () => {
  // If DB_SSL is explicitly set to 'false', don't use SSL
  if (process.env.DB_SSL === 'false') {
    console.log('SSL disabled via DB_SSL=false');
    return false;
  }
  
  // Check if this is a local connection (localhost or 127.0.0.1)
  const isLocalConnection = process.env.DATABASE_URL?.includes('localhost') || 
                            process.env.DATABASE_URL?.includes('127.0.0.1') ||
                            !process.env.DATABASE_URL;
  
  // Build SSL config object
  const sslConfig: any = {};
  
  // If DB_SSL_CERT (base64 encoded certificate) is provided, use it
  if (process.env.DB_SSL_CERT) {
    try {
      const certBuffer = Buffer.from(process.env.DB_SSL_CERT, 'base64');
      sslConfig.ca = certBuffer.toString('utf-8');
      console.log('SSL certificate loaded from DB_SSL_CERT (base64)');
    } catch (error) {
      console.error('Error decoding DB_SSL_CERT:', error);
      throw new Error('Failed to decode DB_SSL_CERT. Make sure it is base64 encoded.');
    }
  }
  
  // Set rejectUnauthorized based on environment variable
  if (process.env.DB_SSL_REJECT_UNAUTHORIZED !== undefined) {
    sslConfig.rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false';
    console.log('SSL rejectUnauthorized set to:', sslConfig.rejectUnauthorized);
  } else {
    // Default: reject unauthorized unless certificate is provided
    sslConfig.rejectUnauthorized = !process.env.DB_SSL_CERT;
  }
  
  // If DB_SSL_REJECT_UNAUTHORIZED is explicitly set, we likely need SSL
  // This handles the case where user sets it but SSL wasn't detected
  if (process.env.DB_SSL_REJECT_UNAUTHORIZED !== undefined || process.env.DB_SSL_CERT) {
    console.log('SSL enabled (DB_SSL_REJECT_UNAUTHORIZED or DB_SSL_CERT detected)');
    return sslConfig;
  }
  
  // If DB_SSL is explicitly 'true', use SSL
  if (process.env.DB_SSL === 'true') {
    return sslConfig;
  }
  
  // If DATABASE_URL contains SSL requirement, use SSL
  if (process.env.DATABASE_URL?.includes('sslmode=require')) {
    return sslConfig;
  }
  
  // For non-local connections (cloud databases), enable SSL by default
  // Most cloud providers require SSL
  if (!isLocalConnection) {
    console.log('SSL enabled (non-local connection detected)');
    return sslConfig;
  }
  
  // Default: no SSL for local connections
  console.log('SSL disabled (local connection)');
  return false;
};

// Get SSL config
const sslConfig = getSslConfig();
console.log('Final SSL config:', sslConfig);
console.log('');

// Build pool configuration
// Remove sslmode from connection string if present, we'll handle SSL via config
let connectionString = process.env.DATABASE_URL || '';
if (connectionString.includes('sslmode=')) {
  connectionString = connectionString.replace(/[?&]sslmode=[^&]*/g, '');
  console.log('Removed sslmode from connection string, handling via SSL config');
}

let poolConfig: any = {
  connectionString: connectionString,
};

// Set SSL configuration explicitly
if (sslConfig !== false) {
  // Build SSL config object - ensure it's always an object
  poolConfig.ssl = {};
  
  // Add certificate if provided
  if (sslConfig.ca) {
    poolConfig.ssl.ca = sslConfig.ca;
    console.log('✓ Certificate added to SSL config');
  }
  
  // Set rejectUnauthorized - must be explicitly set
  const rejectUnauth = sslConfig.rejectUnauthorized === false ? false : (sslConfig.rejectUnauthorized ?? true);
  poolConfig.ssl.rejectUnauthorized = rejectUnauth;
  console.log('✓ rejectUnauthorized set to:', rejectUnauth);
  
  // Ensure we have at least rejectUnauthorized set
  if (Object.keys(poolConfig.ssl).length === 0) {
    poolConfig.ssl.rejectUnauthorized = true;
  }
} else {
  poolConfig.ssl = false;
}

console.log('Pool SSL config:', JSON.stringify({ ...poolConfig.ssl, ca: poolConfig.ssl?.ca ? '[certificate loaded]' : undefined }, null, 2));
console.log('');

const pool = new Pool(poolConfig);

interface Migration {
  name: string;
  up: (client: any) => Promise<void>;
  down?: (client: any) => Promise<void>;
}

const migrations: Migration[] = [
  {
    name: 'add_has_pets_column',
    up: async (client) => {
      // Check if column already exists
      const checkResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'help_requests' 
        AND column_name = 'has_pets'
      `);

      if (checkResult.rows.length === 0) {
        await client.query(`
          ALTER TABLE help_requests 
          ADD COLUMN has_pets BOOLEAN NOT NULL DEFAULT FALSE
        `);
        console.log('✓ Added has_pets column');
      } else {
        console.log('✓ Column has_pets already exists, skipping');
      }
    },
    down: async (client) => {
      await client.query(`
        ALTER TABLE help_requests 
        DROP COLUMN IF EXISTS has_pets
      `);
      console.log('✓ Removed has_pets column');
    },
  },
];

async function runMigrations() {
  const client = await pool.connect();
  try {
    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Running migrations...\n');

    for (const migration of migrations) {
      // Check if migration has already been run
      const result = await client.query(
        'SELECT name FROM migrations WHERE name = $1',
        [migration.name]
      );

      if (result.rows.length === 0) {
        console.log(`Running migration: ${migration.name}`);
        await migration.up(client);
        
        // Record migration
        await client.query(
          'INSERT INTO migrations (name) VALUES ($1)',
          [migration.name]
        );
        console.log(`✓ Migration ${migration.name} completed\n`);
      } else {
        console.log(`⏭ Migration ${migration.name} already executed, skipping\n`);
      }
    }

    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

async function rollbackMigration(migrationName: string) {
  const client = await pool.connect();
  try {
    const migration = migrations.find(m => m.name === migrationName);
    
    if (!migration) {
      throw new Error(`Migration ${migrationName} not found`);
    }

    if (!migration.down) {
      throw new Error(`Migration ${migrationName} does not have a rollback function`);
    }

    console.log(`Rolling back migration: ${migrationName}`);
    await migration.down(client);
    
    // Remove migration record
    await client.query('DELETE FROM migrations WHERE name = $1', [migrationName]);
    console.log(`✓ Migration ${migrationName} rolled back`);
  } catch (error) {
    console.error('Error rolling back migration:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  const command = process.argv[2];
  const migrationName = process.argv[3];

  if (command === 'rollback' && migrationName) {
    rollbackMigration(migrationName)
      .then(() => {
        console.log('Rollback complete');
        process.exit(0);
      })
      .catch((error) => {
        console.error('Rollback failed:', error);
        process.exit(1);
      });
  } else {
    runMigrations()
      .then(() => {
        console.log('Migrations complete');
        process.exit(0);
      })
      .catch((error) => {
        console.error('Migrations failed:', error);
        process.exit(1);
      });
  }
}

export { runMigrations, rollbackMigration };

