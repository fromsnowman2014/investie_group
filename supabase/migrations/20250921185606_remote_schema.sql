create sequence "public"."market_indicators_id_seq";

create sequence "public"."stock_profiles_id_seq";

drop policy "Allow anonymous read access" on "public"."ai_analysis";

drop policy "Allow anonymous read access" on "public"."market_overview";

drop policy "Allow anonymous read access" on "public"."news_analysis";

drop policy "Allow anonymous read access" on "public"."stock_data";

revoke delete on table "public"."ai_analysis" from "anon";

revoke insert on table "public"."ai_analysis" from "anon";

revoke references on table "public"."ai_analysis" from "anon";

revoke select on table "public"."ai_analysis" from "anon";

revoke trigger on table "public"."ai_analysis" from "anon";

revoke truncate on table "public"."ai_analysis" from "anon";

revoke update on table "public"."ai_analysis" from "anon";

revoke delete on table "public"."ai_analysis" from "authenticated";

revoke insert on table "public"."ai_analysis" from "authenticated";

revoke references on table "public"."ai_analysis" from "authenticated";

revoke select on table "public"."ai_analysis" from "authenticated";

revoke trigger on table "public"."ai_analysis" from "authenticated";

revoke truncate on table "public"."ai_analysis" from "authenticated";

revoke update on table "public"."ai_analysis" from "authenticated";

revoke delete on table "public"."ai_analysis" from "service_role";

revoke insert on table "public"."ai_analysis" from "service_role";

revoke references on table "public"."ai_analysis" from "service_role";

revoke select on table "public"."ai_analysis" from "service_role";

revoke trigger on table "public"."ai_analysis" from "service_role";

revoke truncate on table "public"."ai_analysis" from "service_role";

revoke update on table "public"."ai_analysis" from "service_role";

revoke delete on table "public"."api_usage_daily" from "anon";

revoke insert on table "public"."api_usage_daily" from "anon";

revoke references on table "public"."api_usage_daily" from "anon";

revoke select on table "public"."api_usage_daily" from "anon";

revoke trigger on table "public"."api_usage_daily" from "anon";

revoke truncate on table "public"."api_usage_daily" from "anon";

revoke update on table "public"."api_usage_daily" from "anon";

revoke delete on table "public"."api_usage_daily" from "authenticated";

revoke insert on table "public"."api_usage_daily" from "authenticated";

revoke references on table "public"."api_usage_daily" from "authenticated";

revoke select on table "public"."api_usage_daily" from "authenticated";

revoke trigger on table "public"."api_usage_daily" from "authenticated";

revoke truncate on table "public"."api_usage_daily" from "authenticated";

revoke update on table "public"."api_usage_daily" from "authenticated";

revoke delete on table "public"."api_usage_daily" from "service_role";

revoke insert on table "public"."api_usage_daily" from "service_role";

revoke references on table "public"."api_usage_daily" from "service_role";

revoke select on table "public"."api_usage_daily" from "service_role";

revoke trigger on table "public"."api_usage_daily" from "service_role";

revoke truncate on table "public"."api_usage_daily" from "service_role";

revoke update on table "public"."api_usage_daily" from "service_role";

revoke delete on table "public"."api_usage_log" from "anon";

revoke insert on table "public"."api_usage_log" from "anon";

revoke references on table "public"."api_usage_log" from "anon";

revoke select on table "public"."api_usage_log" from "anon";

revoke trigger on table "public"."api_usage_log" from "anon";

revoke truncate on table "public"."api_usage_log" from "anon";

revoke update on table "public"."api_usage_log" from "anon";

revoke delete on table "public"."api_usage_log" from "authenticated";

revoke insert on table "public"."api_usage_log" from "authenticated";

revoke references on table "public"."api_usage_log" from "authenticated";

revoke select on table "public"."api_usage_log" from "authenticated";

revoke trigger on table "public"."api_usage_log" from "authenticated";

revoke truncate on table "public"."api_usage_log" from "authenticated";

revoke update on table "public"."api_usage_log" from "authenticated";

revoke delete on table "public"."api_usage_log" from "service_role";

revoke insert on table "public"."api_usage_log" from "service_role";

revoke references on table "public"."api_usage_log" from "service_role";

revoke select on table "public"."api_usage_log" from "service_role";

revoke trigger on table "public"."api_usage_log" from "service_role";

revoke truncate on table "public"."api_usage_log" from "service_role";

revoke update on table "public"."api_usage_log" from "service_role";

revoke delete on table "public"."api_usage_realtime" from "anon";

revoke insert on table "public"."api_usage_realtime" from "anon";

revoke references on table "public"."api_usage_realtime" from "anon";

revoke select on table "public"."api_usage_realtime" from "anon";

revoke trigger on table "public"."api_usage_realtime" from "anon";

revoke truncate on table "public"."api_usage_realtime" from "anon";

revoke update on table "public"."api_usage_realtime" from "anon";

revoke delete on table "public"."api_usage_realtime" from "authenticated";

revoke insert on table "public"."api_usage_realtime" from "authenticated";

revoke references on table "public"."api_usage_realtime" from "authenticated";

revoke select on table "public"."api_usage_realtime" from "authenticated";

revoke trigger on table "public"."api_usage_realtime" from "authenticated";

revoke truncate on table "public"."api_usage_realtime" from "authenticated";

revoke update on table "public"."api_usage_realtime" from "authenticated";

revoke delete on table "public"."api_usage_realtime" from "service_role";

revoke insert on table "public"."api_usage_realtime" from "service_role";

revoke references on table "public"."api_usage_realtime" from "service_role";

revoke select on table "public"."api_usage_realtime" from "service_role";

revoke trigger on table "public"."api_usage_realtime" from "service_role";

revoke truncate on table "public"."api_usage_realtime" from "service_role";

revoke update on table "public"."api_usage_realtime" from "service_role";

revoke delete on table "public"."cache_config" from "anon";

revoke insert on table "public"."cache_config" from "anon";

revoke references on table "public"."cache_config" from "anon";

revoke select on table "public"."cache_config" from "anon";

revoke trigger on table "public"."cache_config" from "anon";

revoke truncate on table "public"."cache_config" from "anon";

revoke update on table "public"."cache_config" from "anon";

revoke delete on table "public"."cache_config" from "authenticated";

revoke insert on table "public"."cache_config" from "authenticated";

revoke references on table "public"."cache_config" from "authenticated";

revoke select on table "public"."cache_config" from "authenticated";

revoke trigger on table "public"."cache_config" from "authenticated";

revoke truncate on table "public"."cache_config" from "authenticated";

revoke update on table "public"."cache_config" from "authenticated";

revoke delete on table "public"."cache_config" from "service_role";

revoke insert on table "public"."cache_config" from "service_role";

revoke references on table "public"."cache_config" from "service_role";

revoke select on table "public"."cache_config" from "service_role";

revoke trigger on table "public"."cache_config" from "service_role";

revoke truncate on table "public"."cache_config" from "service_role";

revoke update on table "public"."cache_config" from "service_role";

revoke delete on table "public"."economic_indicators" from "anon";

revoke insert on table "public"."economic_indicators" from "anon";

revoke references on table "public"."economic_indicators" from "anon";

revoke select on table "public"."economic_indicators" from "anon";

revoke trigger on table "public"."economic_indicators" from "anon";

revoke truncate on table "public"."economic_indicators" from "anon";

revoke update on table "public"."economic_indicators" from "anon";

revoke delete on table "public"."economic_indicators" from "authenticated";

revoke insert on table "public"."economic_indicators" from "authenticated";

revoke references on table "public"."economic_indicators" from "authenticated";

revoke select on table "public"."economic_indicators" from "authenticated";

revoke trigger on table "public"."economic_indicators" from "authenticated";

revoke truncate on table "public"."economic_indicators" from "authenticated";

revoke update on table "public"."economic_indicators" from "authenticated";

revoke delete on table "public"."economic_indicators" from "service_role";

revoke insert on table "public"."economic_indicators" from "service_role";

revoke references on table "public"."economic_indicators" from "service_role";

revoke select on table "public"."economic_indicators" from "service_role";

revoke trigger on table "public"."economic_indicators" from "service_role";

revoke truncate on table "public"."economic_indicators" from "service_role";

revoke update on table "public"."economic_indicators" from "service_role";

revoke delete on table "public"."market_indicators_cache" from "anon";

revoke insert on table "public"."market_indicators_cache" from "anon";

revoke references on table "public"."market_indicators_cache" from "anon";

revoke select on table "public"."market_indicators_cache" from "anon";

revoke trigger on table "public"."market_indicators_cache" from "anon";

revoke truncate on table "public"."market_indicators_cache" from "anon";

revoke update on table "public"."market_indicators_cache" from "anon";

revoke delete on table "public"."market_indicators_cache" from "authenticated";

revoke insert on table "public"."market_indicators_cache" from "authenticated";

revoke references on table "public"."market_indicators_cache" from "authenticated";

revoke select on table "public"."market_indicators_cache" from "authenticated";

revoke trigger on table "public"."market_indicators_cache" from "authenticated";

revoke truncate on table "public"."market_indicators_cache" from "authenticated";

revoke update on table "public"."market_indicators_cache" from "authenticated";

revoke delete on table "public"."market_indicators_cache" from "service_role";

revoke insert on table "public"."market_indicators_cache" from "service_role";

revoke references on table "public"."market_indicators_cache" from "service_role";

revoke select on table "public"."market_indicators_cache" from "service_role";

revoke trigger on table "public"."market_indicators_cache" from "service_role";

revoke truncate on table "public"."market_indicators_cache" from "service_role";

revoke update on table "public"."market_indicators_cache" from "service_role";

revoke delete on table "public"."market_overview" from "anon";

revoke insert on table "public"."market_overview" from "anon";

revoke references on table "public"."market_overview" from "anon";

revoke select on table "public"."market_overview" from "anon";

revoke trigger on table "public"."market_overview" from "anon";

revoke truncate on table "public"."market_overview" from "anon";

revoke update on table "public"."market_overview" from "anon";

revoke delete on table "public"."market_overview" from "authenticated";

revoke insert on table "public"."market_overview" from "authenticated";

revoke references on table "public"."market_overview" from "authenticated";

revoke select on table "public"."market_overview" from "authenticated";

revoke trigger on table "public"."market_overview" from "authenticated";

revoke truncate on table "public"."market_overview" from "authenticated";

revoke update on table "public"."market_overview" from "authenticated";

revoke delete on table "public"."market_overview" from "service_role";

revoke insert on table "public"."market_overview" from "service_role";

revoke references on table "public"."market_overview" from "service_role";

revoke select on table "public"."market_overview" from "service_role";

revoke trigger on table "public"."market_overview" from "service_role";

revoke truncate on table "public"."market_overview" from "service_role";

revoke update on table "public"."market_overview" from "service_role";

revoke delete on table "public"."news_analysis" from "anon";

revoke insert on table "public"."news_analysis" from "anon";

revoke references on table "public"."news_analysis" from "anon";

revoke select on table "public"."news_analysis" from "anon";

revoke trigger on table "public"."news_analysis" from "anon";

revoke truncate on table "public"."news_analysis" from "anon";

revoke update on table "public"."news_analysis" from "anon";

revoke delete on table "public"."news_analysis" from "authenticated";

revoke insert on table "public"."news_analysis" from "authenticated";

revoke references on table "public"."news_analysis" from "authenticated";

revoke select on table "public"."news_analysis" from "authenticated";

revoke trigger on table "public"."news_analysis" from "authenticated";

revoke truncate on table "public"."news_analysis" from "authenticated";

revoke update on table "public"."news_analysis" from "authenticated";

revoke delete on table "public"."news_analysis" from "service_role";

revoke insert on table "public"."news_analysis" from "service_role";

revoke references on table "public"."news_analysis" from "service_role";

revoke select on table "public"."news_analysis" from "service_role";

revoke trigger on table "public"."news_analysis" from "service_role";

revoke truncate on table "public"."news_analysis" from "service_role";

revoke update on table "public"."news_analysis" from "service_role";

revoke delete on table "public"."performance_metrics" from "anon";

revoke insert on table "public"."performance_metrics" from "anon";

revoke references on table "public"."performance_metrics" from "anon";

revoke select on table "public"."performance_metrics" from "anon";

revoke trigger on table "public"."performance_metrics" from "anon";

revoke truncate on table "public"."performance_metrics" from "anon";

revoke update on table "public"."performance_metrics" from "anon";

revoke delete on table "public"."performance_metrics" from "authenticated";

revoke insert on table "public"."performance_metrics" from "authenticated";

revoke references on table "public"."performance_metrics" from "authenticated";

revoke select on table "public"."performance_metrics" from "authenticated";

revoke trigger on table "public"."performance_metrics" from "authenticated";

revoke truncate on table "public"."performance_metrics" from "authenticated";

revoke update on table "public"."performance_metrics" from "authenticated";

revoke delete on table "public"."performance_metrics" from "service_role";

revoke insert on table "public"."performance_metrics" from "service_role";

revoke references on table "public"."performance_metrics" from "service_role";

revoke select on table "public"."performance_metrics" from "service_role";

revoke trigger on table "public"."performance_metrics" from "service_role";

revoke truncate on table "public"."performance_metrics" from "service_role";

revoke update on table "public"."performance_metrics" from "service_role";

revoke delete on table "public"."stock_data" from "anon";

revoke insert on table "public"."stock_data" from "anon";

revoke references on table "public"."stock_data" from "anon";

revoke select on table "public"."stock_data" from "anon";

revoke trigger on table "public"."stock_data" from "anon";

revoke truncate on table "public"."stock_data" from "anon";

revoke update on table "public"."stock_data" from "anon";

revoke delete on table "public"."stock_data" from "authenticated";

revoke insert on table "public"."stock_data" from "authenticated";

revoke references on table "public"."stock_data" from "authenticated";

revoke select on table "public"."stock_data" from "authenticated";

revoke trigger on table "public"."stock_data" from "authenticated";

revoke truncate on table "public"."stock_data" from "authenticated";

revoke update on table "public"."stock_data" from "authenticated";

revoke delete on table "public"."stock_data" from "service_role";

revoke insert on table "public"."stock_data" from "service_role";

revoke references on table "public"."stock_data" from "service_role";

revoke select on table "public"."stock_data" from "service_role";

revoke trigger on table "public"."stock_data" from "service_role";

revoke truncate on table "public"."stock_data" from "service_role";

revoke update on table "public"."stock_data" from "service_role";

revoke delete on table "public"."system_alerts" from "anon";

revoke insert on table "public"."system_alerts" from "anon";

revoke references on table "public"."system_alerts" from "anon";

revoke select on table "public"."system_alerts" from "anon";

revoke trigger on table "public"."system_alerts" from "anon";

revoke truncate on table "public"."system_alerts" from "anon";

revoke update on table "public"."system_alerts" from "anon";

revoke delete on table "public"."system_alerts" from "authenticated";

revoke insert on table "public"."system_alerts" from "authenticated";

revoke references on table "public"."system_alerts" from "authenticated";

revoke select on table "public"."system_alerts" from "authenticated";

revoke trigger on table "public"."system_alerts" from "authenticated";

revoke truncate on table "public"."system_alerts" from "authenticated";

revoke update on table "public"."system_alerts" from "authenticated";

revoke delete on table "public"."system_alerts" from "service_role";

revoke insert on table "public"."system_alerts" from "service_role";

revoke references on table "public"."system_alerts" from "service_role";

revoke select on table "public"."system_alerts" from "service_role";

revoke trigger on table "public"."system_alerts" from "service_role";

revoke truncate on table "public"."system_alerts" from "service_role";

revoke update on table "public"."system_alerts" from "service_role";

revoke delete on table "public"."system_status_history" from "anon";

revoke insert on table "public"."system_status_history" from "anon";

revoke references on table "public"."system_status_history" from "anon";

revoke select on table "public"."system_status_history" from "anon";

revoke trigger on table "public"."system_status_history" from "anon";

revoke truncate on table "public"."system_status_history" from "anon";

revoke update on table "public"."system_status_history" from "anon";

revoke delete on table "public"."system_status_history" from "authenticated";

revoke insert on table "public"."system_status_history" from "authenticated";

revoke references on table "public"."system_status_history" from "authenticated";

revoke select on table "public"."system_status_history" from "authenticated";

revoke trigger on table "public"."system_status_history" from "authenticated";

revoke truncate on table "public"."system_status_history" from "authenticated";

revoke update on table "public"."system_status_history" from "authenticated";

revoke delete on table "public"."system_status_history" from "service_role";

revoke insert on table "public"."system_status_history" from "service_role";

revoke references on table "public"."system_status_history" from "service_role";

revoke select on table "public"."system_status_history" from "service_role";

revoke trigger on table "public"."system_status_history" from "service_role";

revoke truncate on table "public"."system_status_history" from "service_role";

revoke update on table "public"."system_status_history" from "service_role";

alter table "public"."ai_analysis" drop constraint "ai_analysis_confidence_check";

alter table "public"."ai_analysis" drop constraint "ai_analysis_rating_check";

alter table "public"."ai_analysis" drop constraint "ai_analysis_recommendation_check";

alter table "public"."system_alerts" drop constraint "system_alerts_alert_level_check";

alter table "public"."system_status_history" drop constraint "system_status_history_overall_status_check";

drop function if exists "public"."cleanup_old_performance_metrics"();

drop function if exists "public"."cleanup_old_status_history"();

drop function if exists "public"."get_latest_system_health"();

drop function if exists "public"."get_performance_trends"(metric_name_param character varying, hours_back integer);

drop function if exists "public"."record_system_status"(p_overall_status character varying, p_database_status character varying, p_collection_status character varying, p_cache_status character varying, p_api_status character varying, p_total_alerts integer, p_critical_alerts integer, p_cache_hit_rate numeric, p_avg_data_age_hours numeric, p_total_indicators integer, p_details jsonb);

alter table "public"."market_overview" drop constraint "market_overview_pkey";

alter table "public"."performance_metrics" drop constraint "performance_metrics_pkey";

alter table "public"."stock_data" drop constraint "stock_data_pkey";

alter table "public"."system_alerts" drop constraint "system_alerts_pkey";

alter table "public"."system_status_history" drop constraint "system_status_history_pkey";

drop index if exists "public"."idx_ai_analysis_symbol_created";

drop index if exists "public"."idx_market_overview_created";

drop index if exists "public"."idx_news_analysis_symbol_created";

drop index if exists "public"."idx_news_analysis_type_created";

drop index if exists "public"."idx_performance_metrics_created";

drop index if exists "public"."idx_performance_metrics_name_created";

drop index if exists "public"."idx_performance_metrics_value";

drop index if exists "public"."idx_stock_data_symbol_created";

drop index if exists "public"."idx_system_alerts_component_created";

drop index if exists "public"."idx_system_alerts_level_created";

drop index if exists "public"."idx_system_alerts_unacknowledged";

drop index if exists "public"."idx_system_status_history_created";

drop index if exists "public"."market_overview_pkey";

drop index if exists "public"."performance_metrics_pkey";

drop index if exists "public"."stock_data_pkey";

drop index if exists "public"."system_alerts_pkey";

drop index if exists "public"."system_status_history_pkey";

drop table "public"."market_overview";

drop table "public"."performance_metrics";

drop table "public"."stock_data";

drop table "public"."system_alerts";

drop table "public"."system_status_history";


  create table "public"."macro_news" (
    "id" uuid not null default gen_random_uuid(),
    "top_headline" text not null,
    "articles" jsonb default '[]'::jsonb,
    "total_articles" integer default 0,
    "market_impact" character varying(10),
    "source" character varying(50) default 'serpapi'::character varying,
    "query_used" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."market_indicators" (
    "id" integer not null default nextval('market_indicators_id_seq'::regclass),
    "date" date default CURRENT_DATE,
    "indices" text,
    "sectors" text,
    "market_sentiment" character varying(20),
    "created_at" timestamp with time zone default now()
      );



  create table "public"."stock_news" (
    "id" uuid not null default gen_random_uuid(),
    "symbol" character varying(10) not null,
    "headline" text not null,
    "articles" jsonb default '[]'::jsonb,
    "sentiment" character varying(10),
    "source" character varying(50) default 'serpapi'::character varying,
    "query_used" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."stock_profiles" (
    "id" integer not null default nextval('stock_profiles_id_seq'::regclass),
    "symbol" character varying(10) not null,
    "current_price" numeric(10,2),
    "change_percent" numeric(5,2),
    "market_cap" character varying(20),
    "volume" character varying(20),
    "created_at" timestamp with time zone default now()
      );


alter table "public"."ai_analysis" drop column "ai_source";

alter table "public"."ai_analysis" drop column "analysis_date";

alter table "public"."ai_analysis" drop column "rating";

alter table "public"."ai_analysis" drop column "summary";

alter table "public"."ai_analysis" add column "overview" text not null;

alter table "public"."ai_analysis" add column "risk_level" character varying(10);

alter table "public"."ai_analysis" add column "source" character varying(50) default 'claude_ai'::character varying;

alter table "public"."ai_analysis" add column "time_horizon" character varying(50);

alter table "public"."ai_analysis" add column "updated_at" timestamp with time zone default now();

alter table "public"."ai_analysis" alter column "confidence" drop not null;

alter table "public"."ai_analysis" alter column "id" set default gen_random_uuid();

alter table "public"."ai_analysis" alter column "id" set data type uuid using "id"::uuid;

alter table "public"."ai_analysis" alter column "key_factors" set default '{}'::text[];

alter table "public"."ai_analysis" alter column "key_factors" set data type text[] using "key_factors"::text[];

alter table "public"."ai_analysis" alter column "recommendation" drop not null;

alter table "public"."ai_analysis" disable row level security;

alter table "public"."news_analysis" disable row level security;

alter sequence "public"."market_indicators_id_seq" owned by "public"."market_indicators"."id";

alter sequence "public"."stock_profiles_id_seq" owned by "public"."stock_profiles"."id";

drop sequence if exists "public"."ai_analysis_id_seq";

drop sequence if exists "public"."market_overview_id_seq";

drop sequence if exists "public"."performance_metrics_id_seq";

drop sequence if exists "public"."stock_data_id_seq";

drop sequence if exists "public"."system_status_history_id_seq";

CREATE INDEX idx_ai_analysis_symbol ON public.ai_analysis USING btree (symbol, created_at DESC);

CREATE INDEX idx_ai_analysis_symbol_date ON public.ai_analysis USING btree (symbol, created_at DESC);

CREATE INDEX idx_macro_news_date ON public.macro_news USING btree (created_at DESC);

CREATE INDEX idx_market_indicators_date ON public.market_indicators USING btree (date DESC);

CREATE INDEX idx_stock_news_symbol ON public.stock_news USING btree (symbol, created_at DESC);

CREATE INDEX idx_stock_news_symbol_date ON public.stock_news USING btree (symbol, created_at DESC);

CREATE INDEX idx_stock_profiles_symbol ON public.stock_profiles USING btree (symbol);

CREATE UNIQUE INDEX macro_news_pkey ON public.macro_news USING btree (id);

CREATE UNIQUE INDEX market_indicators_pkey ON public.market_indicators USING btree (id);

CREATE UNIQUE INDEX stock_news_pkey ON public.stock_news USING btree (id);

CREATE UNIQUE INDEX stock_profiles_pkey ON public.stock_profiles USING btree (id);

CREATE UNIQUE INDEX unique_market_indicators_date ON public.market_indicators USING btree (date);

CREATE UNIQUE INDEX unique_stock_profile_symbol ON public.stock_profiles USING btree (symbol);

alter table "public"."macro_news" add constraint "macro_news_pkey" PRIMARY KEY using index "macro_news_pkey";

alter table "public"."market_indicators" add constraint "market_indicators_pkey" PRIMARY KEY using index "market_indicators_pkey";

alter table "public"."stock_news" add constraint "stock_news_pkey" PRIMARY KEY using index "stock_news_pkey";

alter table "public"."stock_profiles" add constraint "stock_profiles_pkey" PRIMARY KEY using index "stock_profiles_pkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
 RETURNS integer
 LANGUAGE sql
AS $function$
  UPDATE market_indicators_cache
  SET is_active = false
  WHERE expires_at < NOW() AND is_active = true;

  SELECT COUNT(*)::INTEGER FROM market_indicators_cache
  WHERE is_active = false AND expires_at < NOW();
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_old_api_logs()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  DELETE FROM api_usage_log
  WHERE request_timestamp < NOW() - INTERVAL '30 days';

  DELETE FROM api_usage_daily
  WHERE date_tracked < CURRENT_DATE - INTERVAL '90 days';

  DELETE FROM api_usage_realtime
  WHERE expires_at < NOW();
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_cache_config(p_config_key text DEFAULT NULL::text)
 RETURNS TABLE(config_key character varying, config_value text, description text)
 LANGUAGE sql
 STABLE
AS $function$
  SELECT
    cc.config_key,
    cc.config_value,
    cc.description
  FROM cache_config cc
  WHERE p_config_key IS NULL OR cc.config_key = p_config_key
  ORDER BY cc.config_key;
$function$
;

CREATE OR REPLACE FUNCTION public.get_latest_market_indicator(p_indicator_type text)
 RETURNS TABLE(id bigint, indicator_type character varying, data_value jsonb, metadata jsonb, data_source character varying, created_at timestamp with time zone, expires_at timestamp with time zone, age_seconds integer)
 LANGUAGE sql
 STABLE
AS $function$
  SELECT
    mic.id,
    mic.indicator_type,
    mic.data_value,
    mic.metadata,
    mic.data_source,
    mic.created_at,
    mic.expires_at,
    EXTRACT(EPOCH FROM (NOW() - mic.created_at))::INTEGER as age_seconds
  FROM market_indicators_cache mic
  WHERE mic.indicator_type = p_indicator_type
    AND mic.is_active = true
  ORDER BY mic.created_at DESC
  LIMIT 1;
$function$
;

CREATE OR REPLACE FUNCTION public.update_daily_usage_summary()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  INSERT INTO api_usage_daily (
    date_tracked, api_provider, api_key_hash,
    total_requests, successful_requests, failed_requests,
    rate_limited_requests, first_request_at, last_request_at,
    avg_response_time_ms, min_response_time_ms, max_response_time_ms
  )
  VALUES (
    DATE(NEW.request_timestamp), NEW.api_provider, NEW.api_key_hash,
    1,
    CASE WHEN NEW.success THEN 1 ELSE 0 END,
    CASE WHEN NOT NEW.success THEN 1 ELSE 0 END,
    CASE WHEN NEW.error_type = 'rate_limit' THEN 1 ELSE 0 END,
    NEW.request_timestamp, NEW.request_timestamp,
    NEW.response_time_ms, NEW.response_time_ms, NEW.response_time_ms
  )
  ON CONFLICT (date_tracked, api_provider, api_key_hash)
  DO UPDATE SET
    total_requests = api_usage_daily.total_requests + 1,
    successful_requests = api_usage_daily.successful_requests +
      CASE WHEN NEW.success THEN 1 ELSE 0 END,
    failed_requests = api_usage_daily.failed_requests +
      CASE WHEN NOT NEW.success THEN 1 ELSE 0 END,
    rate_limited_requests = api_usage_daily.rate_limited_requests +
      CASE WHEN NEW.error_type = 'rate_limit' THEN 1 ELSE 0 END,
    last_request_at = NEW.request_timestamp,
    avg_response_time_ms =
      (api_usage_daily.avg_response_time_ms * (api_usage_daily.total_requests - 1) + NEW.response_time_ms)
      / api_usage_daily.total_requests,
    min_response_time_ms = LEAST(api_usage_daily.min_response_time_ms, NEW.response_time_ms),
    max_response_time_ms = GREATEST(api_usage_daily.max_response_time_ms, NEW.response_time_ms),
    updated_at = NOW();

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_realtime_usage()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  INSERT INTO api_usage_realtime (
    api_provider, api_key_hash, requests_this_hour, requests_today, last_request_at,
    is_rate_limited, rate_limit_reset_at,
    health_status
  )
  VALUES (
    NEW.api_provider, NEW.api_key_hash, 1, 1, NEW.request_timestamp,
    NEW.error_type = 'rate_limit',
    NEW.rate_limit_reset,
    CASE
      WHEN NEW.success THEN 'healthy'
      WHEN NEW.error_type = 'rate_limit' THEN 'error'
      ELSE 'warning'
    END
  )
  ON CONFLICT (api_provider, api_key_hash)
  DO UPDATE SET
    requests_this_hour = CASE
      WHEN api_usage_realtime.last_request_at < DATE_TRUNC('hour', NEW.request_timestamp)
      THEN 1
      ELSE api_usage_realtime.requests_this_hour + 1
    END,
    requests_today = CASE
      WHEN api_usage_realtime.last_request_at < DATE_TRUNC('day', NEW.request_timestamp)
      THEN 1
      ELSE api_usage_realtime.requests_today + 1
    END,
    last_request_at = NEW.request_timestamp,
    is_rate_limited = NEW.error_type = 'rate_limit',
    rate_limit_reset_at = COALESCE(NEW.rate_limit_reset, api_usage_realtime.rate_limit_reset_at),
    health_status = CASE
      WHEN NEW.success THEN 'healthy'
      WHEN NEW.error_type = 'rate_limit' THEN 'error'
      ELSE 'warning'
    END,
    expires_at = NOW() + INTERVAL '24 hours';

  RETURN NEW;
END;
$function$
;


  create policy "Allow all operations"
  on "public"."ai_analysis"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "Allow all operations"
  on "public"."macro_news"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "Allow all operations"
  on "public"."market_indicators"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "Allow service role full access"
  on "public"."news_analysis"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "Allow all operations"
  on "public"."stock_news"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "Allow all operations"
  on "public"."stock_profiles"
  as permissive
  for all
  to public
using (true)
with check (true);



