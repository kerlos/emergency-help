# Emergency Help Map Application

A mobile-first emergency help map application built with Next.js, React, Leaflet.js, and PostgreSQL. Allows users to request and view emergency help locations with Thai language interface.

## Features

- Interactive map with OpenStreetMap tiles
- Add help request pins with draggable location selection
- View help request details
- Delete or mark requests as resolved (for pin owners)
- Auto-refresh every 30 seconds
- Mobile-first responsive design
- Thai language interface

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+ installed and running

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup PostgreSQL Database

Create a PostgreSQL database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE emergency_help;

# Exit psql
\q
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and set your PostgreSQL connection string:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/emergency_help
```

Or use individual variables:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=emergency_help
DB_USER=your_username
DB_PASSWORD=your_password
```

### 4. Initialize Database

Run the database initialization script:

```bash
npx tsx lib/init-db.ts
```

This will create the `help_requests` table and necessary indexes.

### 5. Run Migrations (if updating existing database)

If you're updating an existing database with new schema changes, run migrations:

```bash
npm run migrate
```

Or directly:

```bash
npx tsx lib/migrate.ts
```

To rollback a migration:

```bash
npm run migrate:rollback <migration_name>
```

Example:

```bash
npm run migrate:rollback add_has_pets_column
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Database Schema

The `help_requests` table includes:
- `id` (SERIAL PRIMARY KEY)
- `place_name` (TEXT)
- `phone` (TEXT)
- `backup_phone` (TEXT)
- `num_people` (TEXT)
- `has_elderly` (BOOLEAN)
- `has_children` (BOOLEAN)
- `has_sick` (BOOLEAN)
- `additional_message` (TEXT)
- `latitude` (DOUBLE PRECISION)
- `longitude` (DOUBLE PRECISION)
- `created_at` (TIMESTAMP)
- `status` (TEXT - 'active' or 'resolved')

## Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Map**: Leaflet.js with OpenStreetMap
- **Database**: PostgreSQL
- **API**: Next.js API Routes

## Project Structure

```
app/
├── api/              # API routes
├── components/       # React components
├── lib/             # Database and utilities
├── types/           # TypeScript interfaces
└── page.tsx         # Main page
lib/
└── init-db.ts       # Database initialization
```

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (recommended)
- Or use individual variables: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `DB_SSL` - Set to `true` if your database requires SSL (default: auto-detect)
- `DB_SSL_REJECT_UNAUTHORIZED` - Set to `false` to allow self-signed certificates (default: `true`)
- `DB_SSL_CERT` - Base64-encoded SSL certificate (.crt file)

### Using SSL Certificate

If you have a `.crt` certificate file, encode it to base64 and add it to your `.env`:

**Option 1: Using the helper script**
```bash
./scripts/encode-cert.sh path/to/your-cert.crt
```

**Option 2: Using command line**
```bash
# macOS/Linux
cat your-cert.crt | base64 | tr -d '\n'

# Or save to file
base64 -i your-cert.crt | tr -d '\n' > cert-base64.txt
```

Then add to your `.env`:
```env
DB_SSL_CERT=<paste-the-base64-string-here>
```

When `DB_SSL_CERT` is provided, the certificate will be used for SSL connections and `rejectUnauthorized` will default to `true` (secure).

## License

MIT
