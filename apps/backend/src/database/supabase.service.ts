import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      this.logger.warn('Supabase configuration missing - some features may be limited');
      return;
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    this.logger.log('Supabase client initialized successfully');
  }

  getClient(): SupabaseClient {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized - check configuration');
    }
    return this.supabase;
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.supabase) {
        return { success: false, error: 'Supabase client not initialized' };
      }

      // 간단한 연결 테스트
      const { data, error } = await this.supabase
        .from('_health_check')
        .select('*')
        .limit(1);
      
      if (error && error.code !== 'PGRST116') { // 테이블이 없는 경우는 정상
        return { success: false, error: error.message };
      }

      this.logger.log('Supabase connection test successful');
      return { success: true };
    } catch (error) {
      this.logger.error('Supabase connection test failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // 데이터베이스 스키마 확인
  async checkSchema(): Promise<{ tables: string[]; error?: string }> {
    try {
      const { data, error } = await this.supabase.rpc('get_table_names');
      
      if (error) {
        return { tables: [], error: error.message };
      }

      return { tables: data || [] };
    } catch (error) {
      this.logger.warn('Schema check failed, using alternative method');
      
      // 대안: information_schema 사용
      try {
        const { data, error: schemaError } = await this.supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public');

        if (schemaError) {
          return { tables: [], error: schemaError.message };
        }

        const tableNames = data?.map(row => row.table_name) || [];
        return { tables: tableNames };
      } catch (altError) {
        return { tables: [], error: altError.message };
      }
    }
  }
}