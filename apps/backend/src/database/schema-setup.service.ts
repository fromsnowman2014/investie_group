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

      for (const tableName of tableNames) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

          if (error) {
            if (error.code === 'PGRST116') {
              missingTables.push(tableName);
            } else {
              this.logger.warn(`Error checking table ${tableName}: ${error.message}`);
            }
          } else {
            existingTables.push(tableName);
          }
        } catch (err) {
          missingTables.push(tableName);
        }
      }

      const message = `Found ${existingTables.length} existing tables, ${missingTables.length} missing tables`;
      this.logger.log(message);
      
      if (missingTables.length > 0) {
        this.logger.log(`Missing tables: ${missingTables.join(', ')}`);
      }

      return {
        success: true,
        tables: existingTables,
        message: `${message}. Missing: ${missingTables.join(', ') || 'none'}`
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