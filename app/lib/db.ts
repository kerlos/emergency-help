import { Pool } from 'pg';
import { HelpRequest, HelpRequestInput } from '../types';
import dotenv from 'dotenv';

dotenv.config();

// Create connection pool with SSL configuration
const getSslConfig = () => {
  // If DB_SSL is explicitly set to 'false', don't use SSL
  if (process.env.DB_SSL === 'false') {
    return false;
  }
  
  // Build SSL config object
  const sslConfig: any = {};
  
  // If DB_SSL_CERT (base64 encoded certificate) is provided, use it
  if (process.env.DB_SSL_CERT) {
    try {
      const certBuffer = Buffer.from(process.env.DB_SSL_CERT, 'base64');
      sslConfig.ca = certBuffer.toString('utf-8');
    } catch (error) {
      console.error('Error decoding DB_SSL_CERT:', error);
      throw new Error('Failed to decode DB_SSL_CERT. Make sure it is base64 encoded.');
    }
  }
  
  // Set rejectUnauthorized based on environment variable
  if (process.env.DB_SSL_REJECT_UNAUTHORIZED !== undefined) {
    sslConfig.rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false';
  } else {
    // Default: reject unauthorized unless certificate is provided
    sslConfig.rejectUnauthorized = !process.env.DB_SSL_CERT;
  }
  
  // If DATABASE_URL contains SSL requirement or DB_SSL is 'true', use SSL
  if (process.env.DATABASE_URL?.includes('sslmode=require') || process.env.DB_SSL === 'true') {
    return sslConfig;
  }
  
  // If certificate is provided, use SSL
  if (process.env.DB_SSL_CERT) {
    return sslConfig;
  }
  
  // Default: no SSL for local connections
  return false;
};

// Remove sslmode from connection string if present, we'll handle SSL via config
let connectionString = process.env.DATABASE_URL || '';
if (connectionString.includes('sslmode=')) {
  connectionString = connectionString.replace(/[?&]sslmode=[^&]*/g, '');
}

const sslConfig = getSslConfig();

const pool = new Pool({
  connectionString: connectionString,
  ssl: sslConfig,
  // Or use individual config:
  // host: process.env.DB_HOST || 'localhost',
  // port: parseInt(process.env.DB_PORT || '5432'),
  // database: process.env.DB_NAME || 'emergency_help',
  // user: process.env.DB_USER,
  // password: process.env.DB_PASSWORD,
});

export async function getAllActiveHelpRequests(): Promise<HelpRequest[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT * FROM help_requests 
      WHERE status = 'active' 
      ORDER BY created_at DESC
    `);

    return result.rows.map((row: any) => ({
      id: row.id,
      place_name: row.place_name,
      phone: row.phone,
      backup_phone: row.backup_phone,
      num_people: row.num_people,
      has_elderly: Boolean(row.has_elderly),
      has_children: Boolean(row.has_children),
      has_sick: Boolean(row.has_sick),
      has_pets: Boolean(row.has_pets),
      additional_message: row.additional_message,
      latitude: row.latitude,
      longitude: row.longitude,
      created_at: row.created_at,
      status: row.status,
    }));
  } finally {
    client.release();
  }
}

export async function createHelpRequest(data: HelpRequestInput): Promise<number> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      INSERT INTO help_requests (
        place_name, phone, backup_phone, num_people, has_elderly, has_children, 
        has_sick, has_pets, additional_message, latitude, longitude
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `, [
      data.place_name || null,
      data.phone,
      data.backup_phone || null,
      data.num_people || '',
      data.has_elderly,
      data.has_children,
      data.has_sick,
      data.has_pets,
      data.additional_message || null,
      data.latitude,
      data.longitude
    ]);

    return result.rows[0].id;
  } finally {
    client.release();
  }
}

export async function deleteHelpRequest(id: number): Promise<boolean> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'DELETE FROM help_requests WHERE id = $1',
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  } finally {
    client.release();
  }
}

export async function updateHelpRequestStatus(id: number, status: 'resolved'): Promise<boolean> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'UPDATE help_requests SET status = $1 WHERE id = $2',
      [status, id]
    );
    return (result.rowCount ?? 0) > 0;
  } finally {
    client.release();
  }
}

export async function getHelpRequestById(id: number): Promise<HelpRequest | null> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM help_requests WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      place_name: row.place_name,
      phone: row.phone,
      backup_phone: row.backup_phone,
      num_people: row.num_people,
      has_elderly: Boolean(row.has_elderly),
      has_children: Boolean(row.has_children),
      has_sick: Boolean(row.has_sick),
      has_pets: Boolean(row.has_pets),
      additional_message: row.additional_message,
      latitude: row.latitude,
      longitude: row.longitude,
      created_at: row.created_at,
      status: row.status,
    };
  } finally {
    client.release();
  }
}
