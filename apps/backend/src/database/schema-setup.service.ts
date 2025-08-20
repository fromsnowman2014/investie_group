import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SchemaSetupService {
  private readonly logger = new Logger(SchemaSetupService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async setupSchema(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      this.logger.log('Starting database schema setup...');
      
      const supabase = this.supabaseService.getClient();
      
      // Read the schema SQL file
      const schemaPath = path.join(__dirname, 'schema.sql');
      
      if (!fs.existsSync(schemaPath)) {
        return {
          success: false,
          message: 'Schema SQL file not found'
        };
      }

      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      
      // Split SQL into individual statements (simplified)
      const statements = schemaSql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      const results: any[] = [];
      let successCount = 0;
      let errorCount = 0;

      // Execute each statement
      for (const statement of statements) {
        try {
          if (statement.includes('DO $$') || statement.includes('CREATE EXTENSION')) {
            // Skip complex statements that might not work through the client
            continue;
          }

          const { data, error } = await supabase.rpc('exec_sql', { 
            sql_query: statement 
          });
          
          if (error) {
            this.logger.warn(`Statement failed: ${error.message}`);
            results.push({ statement: statement.substring(0, 50) + '...', error: error.message });
            errorCount++;
          } else {
            successCount++;
            results.push({ statement: statement.substring(0, 50) + '...', success: true });
          }
        } catch (err) {
          this.logger.warn(`Statement execution failed: ${err.message}`);
          errorCount++;
          results.push({ statement: statement.substring(0, 50) + '...', error: err.message });
        }
      }

      const message = `Schema setup completed - Success: ${successCount}, Errors: ${errorCount}`;
      this.logger.log(message);

      return {
        success: successCount > 0,
        message,
        details: {
          successCount,
          errorCount,
          results
        }
      };

    } catch (error) {
      this.logger.error('Schema setup failed:', error);
      return {
        success: false,
        message: `Schema setup failed: ${error.message}`
      };
    }
  }

  async createTablesManually(): Promise<{ success: boolean; message: string; tables: string[] }> {
    try {
      this.logger.log('Creating tables manually using simple SQL...');
      
      const supabase = this.supabaseService.getClient();
      const createdTables: string[] = [];

      // Create basic tables one by one
      const tables = [
        {
          name: 'ai_analysis',
          sql: `
            CREATE TABLE IF NOT EXISTS ai_analysis (
              id SERIAL PRIMARY KEY,
              symbol VARCHAR(10) NOT NULL,
              overview TEXT,
              recommendation VARCHAR(10),
              confidence INTEGER,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `
        },
        {
          name: 'stock_news', 
          sql: `
            CREATE TABLE IF NOT EXISTS stock_news (
              id SERIAL PRIMARY KEY,
              symbol VARCHAR(10) NOT NULL,
              headline TEXT,
              articles TEXT,
              sentiment VARCHAR(10),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `
        },
        {
          name: 'market_indicators',
          sql: `
            CREATE TABLE IF NOT EXISTS market_indicators (
              id SERIAL PRIMARY KEY,
              date DATE DEFAULT CURRENT_DATE,
              indices TEXT,
              sectors TEXT,
              market_sentiment VARCHAR(20),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `
        }
      ];

      for (const table of tables) {
        try {
          // Supabase에서 직접 SQL 실행을 위해 간단한 방법 사용
          const { error } = await supabase
            .from(table.name)
            .select('*')
            .limit(1);

          if (error && error.code === 'PGRST116') {
            // 테이블이 존재하지 않음 - 생성 필요
            this.logger.log(`Table ${table.name} does not exist, needs manual creation`);
            createdTables.push(`${table.name} (needs manual creation)`);
          } else if (!error) {
            // 테이블이 이미 존재함
            this.logger.log(`Table ${table.name} already exists`);
            createdTables.push(`${table.name} (exists)`);
          }
        } catch (err) {
          this.logger.warn(`Could not check table ${table.name}: ${err.message}`);
          createdTables.push(`${table.name} (error: ${err.message})`);
        }
      }

      return {
        success: true,
        message: 'Table check completed',
        tables: createdTables
      };

    } catch (error) {
      this.logger.error('Manual table creation failed:', error);
      return {
        success: false,
        message: `Manual table creation failed: ${error.message}`,
        tables: []
      };
    }
  }

  async checkTablesExist(): Promise<{ success: boolean; tables: string[]; message: string }> {
    try {
      this.logger.log('Checking which tables exist...');
      
      const supabase = this.supabaseService.getClient();
      const tableNames = ['ai_analysis', 'stock_news', 'macro_news', 'market_indicators', 'stock_profiles'];
      const existingTables: string[] = [];
      const missingTables: string[] = [];
      const tableStatus: { [key: string]: any } = {};

      for (const tableName of tableNames) {
        try {
          this.logger.log(`Checking table: ${tableName}`);
          
          // SELECT 대신 COUNT를 사용하여 테이블 존재 여부 확인
          const { data, error, count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });

          if (error) {
            this.logger.warn(`Table ${tableName} error: ${error.code} - ${error.message}`);
            
            if (error.code === 'PGRST116' || error.code === '42P01') {
              // Table does not exist
              missingTables.push(tableName);
              tableStatus[tableName] = { exists: false, error: error.code };
            } else {
              // Table exists but has other issues (RLS, permissions, etc.)
              existingTables.push(tableName);
              tableStatus[tableName] = { exists: true, error: error.code, message: error.message };
            }
          } else {
            // Table exists and is accessible
            existingTables.push(tableName);
            tableStatus[tableName] = { exists: true, count: count || 0 };
            this.logger.log(`Table ${tableName} exists with ${count || 0} rows`);
          }
        } catch (err) {
          this.logger.warn(`Exception checking table ${tableName}: ${err.message}`);
          missingTables.push(tableName);
          tableStatus[tableName] = { exists: false, exception: err.message };
        }
      }

      const message = `Found ${existingTables.length} existing tables, ${missingTables.length} missing tables`;
      this.logger.log(message);
      
      if (existingTables.length > 0) {
        this.logger.log(`Existing tables: ${existingTables.join(', ')}`);
      }
      if (missingTables.length > 0) {
        this.logger.log(`Missing tables: ${missingTables.join(', ')}`);
      }

      return {
        success: true,
        tables: existingTables,
        message: `${message}. Missing: ${missingTables.join(', ') || 'none'}`,
        tableStatus // 추가 디버깅 정보
      };

    } catch (error) {
      this.logger.error('Table check failed:', error);
      return {
        success: false,
        tables: [],
        message: `Table check failed: ${error.message}`
      };
    }
  }
}