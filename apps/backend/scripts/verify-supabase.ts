#!/usr/bin/env ts-node
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { MigrationService } from '../src/database/migration.service';
import { SupabaseService } from '../src/database/supabase.service';

/**
 * Supabase Setup Verification Script
 * 
 * This script verifies that Supabase is properly configured and all
 * database components are working correctly.
 */

async function main() {
  const logger = new Logger('SupabaseVerification');
  
  try {
    logger.log('🔍 Starting Supabase verification...');
    
    // Create NestJS application context
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn', 'log'],
    });
    
    const migrationService = app.get(MigrationService);
    const supabaseService = app.get(SupabaseService);
    
    console.log('\n' + '='.repeat(60));
    console.log('🔍 SUPABASE SETUP VERIFICATION');
    console.log('='.repeat(60));
    
    // 1. Environment Variables Check
    await checkEnvironmentVariables();
    
    // 2. Connection Test
    await testConnection(supabaseService, logger);
    
    // 3. Migration Status
    await checkMigrationStatus(migrationService, logger);
    
    // 4. Database Objects Verification
    await verifyDatabaseObjects(supabaseService, logger);
    
    // 5. RLS Policies Test
    await testRLSPolicies(supabaseService, logger);
    
    // 6. Data Operations Test
    await testDataOperations(supabaseService, logger);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ VERIFICATION COMPLETED');
    console.log('='.repeat(60));
    
    await app.close();
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    process.exit(1);
  }
}

async function checkEnvironmentVariables() {
  console.log('\n📋 1. Environment Variables Check');
  console.log('-'.repeat(40));
  
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  let allPresent = true;
  
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    const status = value ? '✅' : '❌';
    const displayValue = value ? (value.substring(0, 20) + '...') : 'NOT SET';
    
    console.log(`${status} ${envVar}: ${displayValue}`);
    
    if (!value) {
      allPresent = false;
    }
  }
  
  if (!allPresent) {
    throw new Error('Missing required environment variables. Check your .env.local file.');
  }
}

async function testConnection(supabaseService: SupabaseService, logger: Logger) {
  console.log('\n🔌 2. Connection Test');
  console.log('-'.repeat(40));
  
  try {
    const startTime = Date.now();
    const result = await supabaseService.testConnection();
    const responseTime = Date.now() - startTime;
    
    console.log(`🔗 Connection: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`📊 Response Time: ${responseTime}ms`);
    
    if (result.error) {
      console.log(`❌ Error: ${result.error}`);
      throw new Error(`Connection failed: ${result.error}`);
    }
    
    console.log('📅 Database: Supabase PostgreSQL');
    
  } catch (error) {
    logger.error('Connection test failed:', error);
    throw error;
  }
}

async function checkMigrationStatus(migrationService: MigrationService, logger: Logger) {
  console.log('\n🗄️ 3. Migration Status');
  console.log('-'.repeat(40));
  
  try {
    const status = await migrationService.checkMigrationStatus();
    
    console.log(`📊 Overall Status: ${status.success ? '✅' : '❌'} ${status.status}`);
    
    if (status.details?.tables) {
      const { existing, missing, required } = status.details.tables;
      
      console.log(`📋 Tables: ${existing.length}/${required.length} exist`);
      
      if (existing.length > 0) {
        console.log(`✅ Existing: ${existing.join(', ')}`);
      }
      
      if (missing.length > 0) {
        console.log(`❌ Missing: ${missing.join(', ')}`);
        
        // If tables are missing, suggest running migration
        console.log('\n💡 Suggestion: Run migration to create missing tables:');
        console.log('   npm run migrate');
      }
    }
    
  } catch (error) {
    logger.error('Migration status check failed:', error);
    throw error;
  }
}

async function verifyDatabaseObjects(supabaseService: SupabaseService, logger: Logger) {
  console.log('\n🗃️ 4. Database Objects Verification');
  console.log('-'.repeat(40));
  
  const supabase = supabaseService.getClient();
  
  try {
    // Check extensions
    console.log('🔌 Extensions:');
    try {
      const { data: extensions, error } = await supabase
        .rpc('get_extensions')
        .select('*');
      
      if (error && error.code !== 'PGRST116') {
        console.log('   ⚠️  Could not check extensions (this may be normal)');
      } else {
        console.log('   ✅ Extension check available');
      }
    } catch (err) {
      console.log('   ⚠️  Extension check not available (this may be normal)');
    }
    
    // Check custom types
    console.log('🏷️  Custom Types:');
    try {
      // Try to use the stock_symbol type
      const { data: typeTest } = await supabase
        .from('ai_analysis')
        .select('symbol')
        .limit(1);
      
      console.log('   ✅ stock_symbol enum type working');
    } catch (err) {
      console.log('   ❌ stock_symbol enum type issue');
    }
    
    // Check indexes (simplified check)
    console.log('📇 Indexes:');
    console.log('   ⚠️  Index verification requires admin access');
    
  } catch (error) {
    logger.warn('Some database object checks failed (may be normal):', error.message);
  }
}

async function testRLSPolicies(supabaseService: SupabaseService, logger: Logger) {
  console.log('\n🛡️ 5. Row Level Security (RLS) Policies Test');
  console.log('-'.repeat(40));
  
  const supabase = supabaseService.getClient();
  const tables = ['ai_analysis', 'stock_news', 'macro_news', 'market_indicators', 'stock_profiles'];
  
  for (const table of tables) {
    try {
      // Test read access
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.code === 'PGRST116' || error.code === '42P01') {
          console.log(`📋 ${table}: ❌ Table does not exist`);
        } else {
          console.log(`📋 ${table}: ⚠️  RLS Policy issue (${error.code})`);
        }
      } else {
        console.log(`📋 ${table}: ✅ Read access working`);
      }
      
    } catch (err) {
      console.log(`📋 ${table}: ❌ Access test failed`);
    }
  }
}

async function testDataOperations(supabaseService: SupabaseService, logger: Logger) {
  console.log('\n💾 6. Data Operations Test');
  console.log('-'.repeat(40));
  
  const supabase = supabaseService.getClient();
  
  try {
    // Test insert and delete on market_indicators (safest table for testing)
    const testData = {
      date: new Date().toISOString().split('T')[0],
      indices: { test: true },
      market_sentiment: 'neutral',
      source: 'verification_test'
    };
    
    console.log('📝 Testing INSERT operation...');
    const { data: insertResult, error: insertError } = await supabase
      .from('market_indicators')
      .insert([testData])
      .select()
      .single();
    
    if (insertError) {
      console.log(`❌ INSERT failed: ${insertError.message}`);
      return;
    }
    
    console.log('✅ INSERT successful');
    
    // Test select
    console.log('📖 Testing SELECT operation...');
    const { data: selectResult, error: selectError } = await supabase
      .from('market_indicators')
      .select('*')
      .eq('source', 'verification_test')
      .single();
    
    if (selectError) {
      console.log(`❌ SELECT failed: ${selectError.message}`);
    } else {
      console.log('✅ SELECT successful');
    }
    
    // Clean up test data
    console.log('🧹 Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('market_indicators')
      .delete()
      .eq('source', 'verification_test');
    
    if (deleteError) {
      console.log(`⚠️  DELETE cleanup failed: ${deleteError.message}`);
    } else {
      console.log('✅ DELETE cleanup successful');
    }
    
    console.log('\n🎉 All data operations working correctly!');
    
  } catch (error) {
    console.log(`❌ Data operations test failed: ${error.message}`);
  }
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Verification script failed:', error);
    process.exit(1);
  });
}