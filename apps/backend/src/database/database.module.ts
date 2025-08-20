import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseService } from './supabase.service';
import { DatabaseController } from './database.controller';
import { SchemaSetupService } from './schema-setup.service';

@Module({
  imports: [ConfigModule],
  controllers: [DatabaseController],
  providers: [SupabaseService, SchemaSetupService],
  exports: [SupabaseService, SchemaSetupService],
})
export class DatabaseModule {}