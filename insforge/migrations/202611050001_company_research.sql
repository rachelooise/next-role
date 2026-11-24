DO $migration$
BEGIN
  IF EXISTS (SELECT 1 FROM nextrole_internal.schema_migrations WHERE version = '202611050001_company_research') THEN
    RETURN;
  END IF;

  ALTER TABLE public.jobs
    ADD COLUMN company_research_status text NOT NULL DEFAULT 'idle'
      CHECK (company_research_status IN ('idle', 'queued', 'running', 'completed', 'failed')),
    ADD COLUMN company_research_request_id uuid,
    ADD COLUMN company_research_run_id text,
    ADD COLUMN company_research_requested_at timestamptz;

  UPDATE public.jobs SET company_research_status = 'completed' WHERE company_research IS NOT NULL;

  CREATE INDEX jobs_research_active_idx ON public.jobs(user_id, company_research_requested_at)
    WHERE company_research_status IN ('queued', 'running');

  INSERT INTO nextrole_internal.schema_migrations(version) VALUES ('202611050001_company_research');
END;
$migration$;
