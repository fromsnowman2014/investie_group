import { Controller, Get, Post } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { SchemaSetupService } from './schema-setup.service';
import { MigrationService } from './migration.service';

@Controller('api/v1/database')
export class DatabaseController {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly schemaSetupService: SchemaSetupService,
    private readonly migrationService: MigrationService,
  ) {}

  @Get('health')
  async healthCheck() {
    try {
      const connectionTest = await this.supabaseService.testConnection();
      const schemaInfo = await this.supabaseService.checkSchema();
      
      return {
        success: true,
        connection: connectionTest,
        schema: schemaInfo,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('tables')
  async getTables() {
    try {
      const tablesInfo = await this.schemaSetupService.checkTablesExist();
      
      return {
        success: tablesInfo.success,
        tables: tablesInfo.tables,
        count: tablesInfo.tables.length,
        message: tablesInfo.message,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('setup-schema')
  async setupSchema() {
    try {
      const result = await this.schemaSetupService.setupSchema();
      
      return {
        ...result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('create-tables')
  async createTables() {
    try {
      const result = await this.schemaSetupService.createTablesManually();
      
      return {
        ...result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('migrate')
  async runMigration() {
    try {
      const result = await this.migrationService.runFullMigration();
      
      return {
        ...result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('rollback')
  async rollback() {
    try {
      const result = await this.migrationService.rollback();
      
      return {
        ...result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('migration-status')
  async getMigrationStatus() {
    try {
      const result = await this.migrationService.checkMigrationStatus();
      
      return {
        ...result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}