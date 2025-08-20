import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseService } from './supabase.service';
import { DatabaseController } from './database.controller';
import { SchemaSetupService } from './schema-setup.service';
import { MigrationService } from './migration.service';

@Module({
  imports: [ConfigModule],
  controllers: [DatabaseController],
  providers: [SupabaseService, SchemaSetupService, MigrationService],
  exports: [SupabaseService, SchemaSetupService, MigrationService],
})
export class DatabaseModule {}