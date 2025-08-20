# Database Migration Guide

This document provides comprehensive guidance for managing database migrations in the Investie backend project.

## Overview

The migration system provides a robust way to setup and manage the Supabase database schema and initial data. It includes:

- **Full Migration**: Complete database setup with schema and initial data
- **Status Checking**: Verify current migration state
- **Rollback**: Clean database state (development only)
- **API Endpoints**: Web-based migration management

## Quick Start

### Prerequisites

1. Ensure Supabase connection is configured in `.env.local`:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

2. Install dependencies:
```bash
npm install
```

### Run Migration

#### Command Line (Recommended)

```bash
# Run full migration
npm run migrate

# Check migration status
npm run migrate:status

# Rollback (development only - requires FORCE_ROLLBACK=true)
FORCE_ROLLBACK=true npm run migrate:rollback
```

#### API Endpoints

Start the development server and use these endpoints:

```bash
# Check database health and connection
GET http://localhost:3000/api/v1/database/health

# Check migration status
GET http://localhost:3000/api/v1/database/migration-status

# Run full migration
POST http://localhost:3000/api/v1/database/migrate

# Check existing tables
GET http://localhost:3000/api/v1/database/tables

# Manual schema setup
POST http://localhost:3000/api/v1/database/setup-schema

# Rollback (development only)
POST http://localhost:3000/api/v1/database/rollback
```

## Migration Components

### Services

#### MigrationService (`src/database/migration.service.ts`)
- **Purpose**: Orchestrates full migration process
- **Methods**:
  - `runFullMigration()`: Complete database setup
  - `checkMigrationStatus()`: Verify current state
  - `rollback()`: Clean database (development)

#### SchemaSetupService (`src/database/schema-setup.service.ts`)
- **Purpose**: Manages database schema
- **Methods**:
  - `setupSchema()`: Execute SQL schema file
  - `checkTablesExist()`: Verify table creation
  - `createTablesManually()`: Fallback table creation

#### SupabaseService (`src/database/supabase.service.ts`)
- **Purpose**: Supabase client management
- **Methods**:
  - `testConnection()`: Connection verification
  - `checkSchema()`: Schema information
  - `getClient()`: Supabase client instance

### Database Schema

The system creates the following tables:

1. **ai_analysis**: AI-generated stock analysis
2. **stock_news**: Stock-specific news and sentiment
3. **macro_news**: Market-wide economic news
4. **market_indicators**: Daily market metrics
5. **stock_profiles**: Cached stock information

All tables include:
- UUID primary keys
- Created/updated timestamps
- Row Level Security (RLS) enabled
- Appropriate indexes for performance

## Migration Process

### 1. Connection Test
Verifies Supabase connection and credentials.

### 2. Schema Setup
Executes `src/database/schema.sql` to create:
- Database extensions
- Custom types (stock_symbol enum)
- Tables with constraints
- Indexes for performance
- RLS policies

### 3. Table Verification
Confirms all required tables exist and are accessible.

### 4. Initial Data
Populates tables with sample data:
- Market indicators for current date
- Stock profiles for major symbols (AAPL, TSLA, MSFT, GOOGL, AMZN)

### 5. Data Integrity Check
Verifies data was inserted correctly and provides statistics.

## Troubleshooting

### Common Issues

#### Connection Failed
```
Error: Connection test failed
```
**Solution**: Check `.env.local` file has correct Supabase credentials.

#### Permission Denied
```
Error: permission denied for relation [table_name]
```
**Solution**: Ensure service role key is used and RLS policies are correctly configured.

#### Table Already Exists
```
Error: relation "table_name" already exists
```
**Solution**: This is expected behavior. The migration uses `CREATE TABLE IF NOT EXISTS`.

#### Schema Execution Failed
```
Error: Schema setup failed
```
**Solution**: 
1. Check if schema.sql file exists
2. Verify Supabase supports the SQL features used
3. Run individual statements to identify issues

### Debugging Migration

1. **Check migration status**:
```bash
npm run migrate:status
```

2. **Review logs**: Migration service provides detailed logging for each step.

3. **Manual verification**: Use Supabase dashboard to inspect database state.

4. **Test connection**: Use health endpoint to verify basic connectivity.

## Production Deployment

### Environment Setup

1. Configure production Supabase credentials
2. Ensure service role key has necessary permissions
3. Review RLS policies for security

### Deployment Process

```bash
# 1. Check current status
npm run migrate:status

# 2. Run migration
npm run migrate

# 3. Verify success
npm run migrate:status
```

### Security Considerations

- **RLS Policies**: All tables have Row Level Security enabled
- **Service Role**: Use service role key for migrations
- **API Access**: Public read/write access configured for API usage
- **Rollback Protection**: Rollback requires explicit confirmation

## API Response Format

All API endpoints return consistent response format:

```typescript
{
  success: boolean;
  message: string;
  timestamp: string;
  // Additional fields based on endpoint
  details?: any;
  steps?: Array<{
    step: string;
    success: boolean;
    message: string;
    details?: any;
  }>;
}
```

## Development Workflow

### Initial Setup
```bash
npm run migrate
```

### Status Check
```bash
npm run migrate:status
```

### Schema Changes
1. Update `src/database/schema.sql`
2. Run migration: `npm run migrate`
3. Verify changes: `npm run migrate:status`

### Testing
```bash
# Test connection
curl http://localhost:3000/api/v1/database/health

# Check tables
curl http://localhost:3000/api/v1/database/tables
```

### Reset Database (Development)
```bash
FORCE_ROLLBACK=true npm run migrate:rollback
npm run migrate
```

## Monitoring

### Health Checks
- Database connectivity
- Table existence
- Data integrity
- Migration status

### Metrics
- Migration success/failure rates
- Execution time
- Table record counts
- Error patterns

## Support

For issues with migrations:

1. Check this documentation
2. Review service logs
3. Verify Supabase dashboard
4. Test individual components
5. Contact development team

## Files Reference

- `src/database/migration.service.ts` - Main migration orchestration
- `src/database/schema-setup.service.ts` - Schema management
- `src/database/supabase.service.ts` - Supabase client
- `src/database/database.controller.ts` - API endpoints
- `src/database/schema.sql` - Database schema definition
- `scripts/migrate.ts` - Command-line migration script
- `docs/MIGRATION.md` - This documentation