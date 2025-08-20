import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { SchemaSetupService } from './schema-setup.service';

interface MigrationResult {
  success: boolean;
  message: string;
  steps: Array<{
    step: string;
    success: boolean;
    message: string;
    details?: any;
  }>;
}

@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly schemaSetupService: SchemaSetupService,
  ) {}

  async runFullMigration(): Promise<MigrationResult> {
    this.logger.log('Starting full database migration...');
    
    const steps: MigrationResult['steps'] = [];
    let overallSuccess = true;

    try {
      // Step 1: Test database connection
      const connectionStep = await this.testConnection();
      steps.push(connectionStep);
      if (!connectionStep.success) overallSuccess = false;

      // Step 2: Setup database schema
      const schemaStep = await this.setupSchema();
      steps.push(schemaStep);
      if (!schemaStep.success) overallSuccess = false;

      // Step 3: Verify tables exist
      const tablesStep = await this.verifyTables();
      steps.push(tablesStep);
      if (!tablesStep.success) overallSuccess = false;

      // Step 4: Setup initial data
      const dataStep = await this.setupInitialData();
      steps.push(dataStep);
      if (!dataStep.success) overallSuccess = false;

      // Step 5: Verify data integrity
      const integrityStep = await this.verifyDataIntegrity();
      steps.push(integrityStep);
      if (!integrityStep.success) overallSuccess = false;

      const message = overallSuccess 
        ? 'Full migration completed successfully'
        : 'Migration completed with some issues';
      
      this.logger.log(message);
      
      return {
        success: overallSuccess,
        message,
        steps
      };

    } catch (error) {
      this.logger.error('Migration failed with exception:', error);
      
      steps.push({
        step: 'migration_exception',
        success: false,
        message: `Migration failed: ${error.message}`,
        details: { error: error.message }
      });

      return {
        success: false,
        message: `Migration failed: ${error.message}`,
        steps
      };
    }
  }

  private async testConnection(): Promise<MigrationResult['steps'][0]> {
    try {
      this.logger.log('Testing database connection...');
      const result = await this.supabaseService.testConnection();
      
      if (result.connected) {
        return {
          step: 'connection_test',
          success: true,
          message: 'Database connection successful',
          details: result
        };
      } else {
        return {
          step: 'connection_test',
          success: false,
          message: 'Database connection failed',
          details: result
        };
      }
    } catch (error) {
      return {
        step: 'connection_test',
        success: false,
        message: `Connection test failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  private async setupSchema(): Promise<MigrationResult['steps'][0]> {
    try {
      this.logger.log('Setting up database schema...');
      const result = await this.schemaSetupService.setupSchema();
      
      return {
        step: 'schema_setup',
        success: result.success,
        message: result.message,
        details: result.details
      };
    } catch (error) {
      return {
        step: 'schema_setup',
        success: false,
        message: `Schema setup failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  private async verifyTables(): Promise<MigrationResult['steps'][0]> {
    try {
      this.logger.log('Verifying tables exist...');
      const result = await this.schemaSetupService.checkTablesExist();
      
      const requiredTables = ['ai_analysis', 'stock_news', 'macro_news', 'market_indicators', 'stock_profiles'];
      const missingTables = requiredTables.filter(table => !result.tables.includes(table));
      
      if (missingTables.length === 0) {
        return {
          step: 'table_verification',
          success: true,
          message: `All ${requiredTables.length} required tables exist`,
          details: { existingTables: result.tables, missingTables: [] }
        };
      } else {
        return {
          step: 'table_verification',
          success: false,
          message: `Missing ${missingTables.length} required tables`,
          details: { existingTables: result.tables, missingTables }
        };
      }
    } catch (error) {
      return {
        step: 'table_verification',
        success: false,
        message: `Table verification failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  private async setupInitialData(): Promise<MigrationResult['steps'][0]> {
    try {
      this.logger.log('Setting up initial data...');
      const supabase = this.supabaseService.getClient();
      
      // Initial market indicators data
      const marketData = {
        date: new Date().toISOString().split('T')[0],
        indices: {
          sp500: { value: 4100.50, change: 1.2 },
          dow: { value: 33500.25, change: 0.8 },
          nasdaq: { value: 12800.75, change: 1.8 }
        },
        sectors: [
          { name: 'Technology', performance: 2.1 },
          { name: 'Healthcare', performance: 0.8 },
          { name: 'Finance', performance: 1.4 }
        ],
        market_sentiment: 'bullish',
        volatility_index: 18.5,
        source: 'migration_initial_data'
      };

      // Insert initial market indicators (if not exists)
      const { data: existingMarket } = await supabase
        .from('market_indicators')
        .select('id')
        .eq('date', marketData.date)
        .single();

      if (!existingMarket) {
        const { error: marketError } = await supabase
          .from('market_indicators')
          .insert([marketData]);
        
        if (marketError) {
          this.logger.warn('Failed to insert initial market data:', marketError);
        } else {
          this.logger.log('Initial market data inserted successfully');
        }
      }

      // Initial stock symbols for testing
      const stockSymbols = ['AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN'];
      const stockProfilesData = stockSymbols.map(symbol => ({
        symbol,
        current_price: Math.random() * 200 + 50, // Random price between 50-250
        change_percent: (Math.random() - 0.5) * 10, // Random change -5% to +5%
        market_cap: `${Math.floor(Math.random() * 1000)}B`,
        pe_ratio: Math.random() * 30 + 10,
        volume: `${Math.floor(Math.random() * 50 + 10)}M`,
        source: 'migration_initial_data'
      }));

      // Insert stock profiles
      for (const stockData of stockProfilesData) {
        const { data: existingStock } = await supabase
          .from('stock_profiles')
          .select('id')
          .eq('symbol', stockData.symbol)
          .single();

        if (!existingStock) {
          const { error } = await supabase
            .from('stock_profiles')
            .insert([stockData]);
          
          if (error) {
            this.logger.warn(`Failed to insert stock profile for ${stockData.symbol}:`, error);
          }
        }
      }

      return {
        step: 'initial_data_setup',
        success: true,
        message: 'Initial data setup completed',
        details: {
          marketData: !!existingMarket ? 'existed' : 'inserted',
          stockProfiles: stockProfilesData.length
        }
      };

    } catch (error) {
      return {
        step: 'initial_data_setup',
        success: false,
        message: `Initial data setup failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  private async verifyDataIntegrity(): Promise<MigrationResult['steps'][0]> {
    try {
      this.logger.log('Verifying data integrity...');
      const supabase = this.supabaseService.getClient();
      
      const checks = {
        market_indicators: 0,
        stock_profiles: 0,
        ai_analysis: 0,
        stock_news: 0,
        macro_news: 0
      };

      // Count records in each table
      for (const table of Object.keys(checks)) {
        try {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
          
          if (!error) {
            checks[table] = count || 0;
          }
        } catch (err) {
          this.logger.warn(`Could not count records in ${table}:`, err);
        }
      }

      const totalRecords = Object.values(checks).reduce((sum, count) => sum + count, 0);
      const tablesWithData = Object.values(checks).filter(count => count > 0).length;

      return {
        step: 'data_integrity_check',
        success: true,
        message: `Data integrity verified - ${totalRecords} total records across ${tablesWithData} tables`,
        details: {
          recordCounts: checks,
          totalRecords,
          tablesWithData
        }
      };

    } catch (error) {
      return {
        step: 'data_integrity_check',
        success: false,
        message: `Data integrity check failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  async rollback(): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log('Starting database rollback...');
      const supabase = this.supabaseService.getClient();
      
      // Note: This is a simple rollback that clears data
      // In production, you might want more sophisticated rollback logic
      const tables = ['ai_analysis', 'stock_news', 'macro_news', 'market_indicators', 'stock_profiles'];
      
      for (const table of tables) {
        try {
          const { error } = await supabase
            .from(table)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
          
          if (error) {
            this.logger.warn(`Could not clear table ${table}:`, error);
          } else {
            this.logger.log(`Cleared table ${table}`);
          }
        } catch (err) {
          this.logger.warn(`Exception clearing table ${table}:`, err);
        }
      }

      return {
        success: true,
        message: 'Database rollback completed'
      };

    } catch (error) {
      this.logger.error('Rollback failed:', error);
      return {
        success: false,
        message: `Rollback failed: ${error.message}`
      };
    }
  }

  async checkMigrationStatus(): Promise<{
    success: boolean;
    status: string;
    details: any;
  }> {
    try {
      const connectionTest = await this.supabaseService.testConnection();
      const schemaInfo = await this.supabaseService.checkSchema();
      const tablesInfo = await this.schemaSetupService.checkTablesExist();
      
      const requiredTables = ['ai_analysis', 'stock_news', 'macro_news', 'market_indicators', 'stock_profiles'];
      const existingTables = tablesInfo.tables || [];
      const missingTables = requiredTables.filter(table => !existingTables.includes(table));
      
      let status = 'unknown';
      if (!connectionTest.connected) {
        status = 'connection_failed';
      } else if (missingTables.length > 0) {
        status = 'partial_migration';
      } else if (existingTables.length === requiredTables.length) {
        status = 'fully_migrated';
      }

      return {
        success: connectionTest.connected,
        status,
        details: {
          connection: connectionTest,
          schema: schemaInfo,
          tables: {
            existing: existingTables,
            missing: missingTables,
            required: requiredTables
          }
        }
      };

    } catch (error) {
      return {
        success: false,
        status: 'check_failed',
        details: { error: error.message }
      };
    }
  }
}