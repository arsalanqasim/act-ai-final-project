-- Repair migration for installations that already applied 006 before the
-- explicit PostgREST service-role grants were added.
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.whatsapp_ingestion_queue TO service_role;
