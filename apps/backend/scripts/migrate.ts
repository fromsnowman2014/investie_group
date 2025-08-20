#!/usr/bin/env ts-node
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { MigrationService } from '../src/database/migration.service';

/**
 * Standalone migration script
 * Usage: 
 *   npm run migrate           - Run full migration
 *   npm run migrate status    - Check migration status
 *   npm run migrate rollback  - Rollback migration
 */

async function main() {
  const logger = new Logger('MigrationScript');
  
  try {
    // Get command line arguments
    const args = process.argv.slice(2);
    const command = args[0] || 'migrate';
    
    logger.log(`Starting migration script with command: ${command}`);
    
    // Create NestJS application context
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn', 'log'],
    });
    
    // Get migration service
    const migrationService = app.get(MigrationService);
    
    switch (command) {
      case 'migrate':
      case 'run':
        await runMigration(migrationService, logger);
        break;
        
      case 'status':
      case 'check':
        await checkStatus(migrationService, logger);
        break;
        
      case 'rollback':
        await runRollback(migrationService, logger);
        break;
        
      default:
        logger.error(`Unknown command: ${command}`);
        printUsage();
        process.exit(1);
    }
    
    await app.close();
    logger.log('Migration script completed');
    
  } catch (error) {
    logger.error('Migration script failed:', error);
    process.exit(1);
  }
}

async function runMigration(migrationService: MigrationService, logger: Logger) {
  logger.log('Running full database migration...');
  
  const result = await migrationService.runFullMigration();
  
  console.log('\n=== MIGRATION RESULTS ===');
  console.log(`Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`Message: ${result.message}`);
  
  console.log('\n=== STEP DETAILS ===');
  result.steps.forEach((step, index) => {
    const status = step.success ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${step.step}: ${step.message}`);
    
    if (step.details && Object.keys(step.details).length > 0) {
      console.log(`   Details:`, JSON.stringify(step.details, null, 2));
    }
  });
  
  if (!result.success) {
    logger.error('Migration failed. Check the details above.');
    process.exit(1);
  }
}

async function checkStatus(migrationService: MigrationService, logger: Logger) {
  logger.log('Checking migration status...');
  
  const result = await migrationService.checkMigrationStatus();
  
  console.log('\n=== MIGRATION STATUS ===');
  console.log(`Overall Status: ${result.success ? '✅ Connected' : '❌ Failed'}`);
  console.log(`Migration Status: ${result.status}`);
  
  if (result.details) {
    console.log('\n=== CONNECTION ===');
    console.log(`Connected: ${result.details.connection?.connected ? '✅' : '❌'}`);
    if (result.details.connection?.message) {
      console.log(`Message: ${result.details.connection.message}`);
    }
    
    if (result.details.tables) {
      console.log('\n=== TABLES ===');
      console.log(`Required: ${result.details.tables.required.length}`);
      console.log(`Existing: ${result.details.tables.existing.length}`);
      console.log(`Missing: ${result.details.tables.missing.length}`);
      
      if (result.details.tables.existing.length > 0) {
        console.log(`Existing tables: ${result.details.tables.existing.join(', ')}`);
      }
      
      if (result.details.tables.missing.length > 0) {
        console.log(`Missing tables: ${result.details.tables.missing.join(', ')}`);
      }
    }
    
    if (result.details.schema) {
      console.log('\n=== SCHEMA INFO ===');
      console.log(`Schema details:`, JSON.stringify(result.details.schema, null, 2));
    }
  }
}

async function runRollback(migrationService: MigrationService, logger: Logger) {
  logger.log('Running database rollback...');
  
  // Confirm rollback
  if (!process.env.FORCE_ROLLBACK) {
    console.log('\n⚠️  WARNING: This will delete all data in the database!');
    console.log('To proceed, set FORCE_ROLLBACK=true environment variable');
    console.log('Example: FORCE_ROLLBACK=true npm run migrate rollback');
    process.exit(1);
  }
  
  const result = await migrationService.rollback();
  
  console.log('\n=== ROLLBACK RESULTS ===');
  console.log(`Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`Message: ${result.message}`);
  
  if (!result.success) {
    logger.error('Rollback failed.');
    process.exit(1);
  }
}

function printUsage() {
  console.log('\nUsage:');
  console.log('  npm run migrate           - Run full migration');
  console.log('  npm run migrate status    - Check migration status');
  console.log('  npm run migrate rollback  - Rollback migration (requires FORCE_ROLLBACK=true)');
  console.log('\nExamples:');
  console.log('  npm run migrate');
  console.log('  npm run migrate status');
  console.log('  FORCE_ROLLBACK=true npm run migrate rollback');
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
}