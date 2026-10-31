DO $migration$
BEGIN

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  location text,
  current_title text,
  experience_level text CHECK (experience_level IN ('junior', 'mid', 'senior', 'lead')),
  years_experience integer CHECK (years_experience >= 0),
  skills text[] NOT NULL DEFAULT '{}',
  industries text[] NOT NULL DEFAULT '{}',
  work_experience jsonb NOT NULL DEFAULT '[]' CHECK (
    CASE WHEN jsonb_typeof(work_experience) = 'array' THEN jsonb_array_length(work_experience) <= 3 ELSE false END
  ),
  education jsonb CHECK (jsonb_typeof(education) = 'object'),
  job_titles_seeking text[] NOT NULL DEFAULT '{}',
  remote_preference text CHECK (remote_preference IN ('remote', 'onsite', 'hybrid', 'any')),
  preferred_locations text[] NOT NULL DEFAULT '{}',
  salary_expectation text,
  linkedin_url text,
  portfolio_url text,
  work_authorization text CHECK (work_authorization IN ('citizen', 'permanent_resident', 'visa_required')),
  resume_pdf_key text CHECK (resume_pdf_key = id::text || '/resume.pdf'),
  resume_pdf_url text,
  is_complete boolean NOT NULL DEFAULT false,
  completion_percentage integer NOT NULL DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),
  missing_fields text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.agent_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  job_title_searched text NOT NULL,
  location_searched text,
  jobs_found integer NOT NULL DEFAULT 0 CHECK (jobs_found >= 0),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz CHECK (completed_at >= started_at),
  UNIQUE (user_id, id)
);

CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  run_id uuid NOT NULL,
  source text NOT NULL DEFAULT 'search' CHECK (source = 'search'),
  external_id text NOT NULL,
  source_url text NOT NULL,
  external_apply_url text NOT NULL,
  title text NOT NULL,
  company text NOT NULL,
  location text,
  salary text,
  job_type text,
  about_role text,
  responsibilities text[] NOT NULL DEFAULT '{}',
  requirements text[] NOT NULL DEFAULT '{}',
  nice_to_have text[] NOT NULL DEFAULT '{}',
  benefits text[] NOT NULL DEFAULT '{}',
  about_company text,
  match_score integer NOT NULL CHECK (match_score BETWEEN 0 AND 100),
  match_reason text,
  matched_skills text[] NOT NULL DEFAULT '{}',
  missing_skills text[] NOT NULL DEFAULT '{}',
  company_research jsonb CHECK (jsonb_typeof(company_research) = 'object'),
  company_researched_at timestamptz,
  found_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, id),
  UNIQUE (user_id, source, external_id),
  FOREIGN KEY (user_id, run_id) REFERENCES public.agent_runs(user_id, id) ON DELETE NO ACTION
);

CREATE TABLE public.agent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  run_id uuid,
  job_id uuid,
  message text NOT NULL,
  level text NOT NULL DEFAULT 'info' CHECK (level IN ('info', 'success', 'warning', 'error')),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (user_id, run_id) REFERENCES public.agent_runs(user_id, id) ON DELETE NO ACTION,
  FOREIGN KEY (user_id, job_id) REFERENCES public.jobs(user_id, id) ON DELETE NO ACTION
);

CREATE INDEX agent_runs_user_started_idx ON public.agent_runs(user_id, started_at DESC);
CREATE INDEX jobs_user_found_idx ON public.jobs(user_id, found_at DESC);
CREATE INDEX jobs_user_score_idx ON public.jobs(user_id, match_score DESC);
CREATE INDEX jobs_user_researched_idx ON public.jobs(user_id, company_researched_at DESC) WHERE company_research IS NOT NULL;
CREATE INDEX jobs_user_run_idx ON public.jobs(user_id, run_id);
CREATE INDEX agent_logs_user_created_idx ON public.agent_logs(user_id, created_at DESC);
CREATE INDEX agent_logs_user_run_idx ON public.agent_logs(user_id, run_id);
CREATE INDEX agent_logs_user_job_idx ON public.agent_logs(user_id, job_id);

CREATE FUNCTION public.nextrole_touch_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.updated_at = clock_timestamp();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.nextrole_touch_updated_at() FROM PUBLIC;
CREATE TRIGGER profiles_touch_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.nextrole_touch_updated_at();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.profiles, public.agent_runs, public.jobs, public.agent_logs FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles, public.agent_runs, public.jobs, public.agent_logs TO authenticated;

CREATE POLICY profiles_owner ON public.profiles FOR ALL TO authenticated
  USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()));
CREATE POLICY agent_runs_owner ON public.agent_runs FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY jobs_owner ON public.jobs FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY agent_logs_owner ON public.agent_logs FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));

-- Keep the migration ledger outside the API-exposed public schema.
CREATE SCHEMA IF NOT EXISTS nextrole_internal;
REVOKE ALL ON SCHEMA nextrole_internal FROM PUBLIC, anon, authenticated;
CREATE TABLE IF NOT EXISTS nextrole_internal.schema_migrations (
  version text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO nextrole_internal.schema_migrations(version) VALUES ('202610310001_application_schema');

END;
$migration$;
