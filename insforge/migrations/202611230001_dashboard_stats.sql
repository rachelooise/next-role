DO $migration$
BEGIN
  IF EXISTS (SELECT 1 FROM nextrole_internal.schema_migrations WHERE version = '202611230001_dashboard_stats') THEN
    RETURN;
  END IF;

  CREATE FUNCTION public.dashboard_stats()
  RETURNS jsonb
  LANGUAGE sql STABLE SECURITY INVOKER
  SET search_path = ''
  AS $function$
    SELECT jsonb_build_object(
      'totalJobs', count(*),
      'averageMatchRate', avg(match_score),
      'companiesResearched', count(*) FILTER (WHERE company_research IS NOT NULL),
      'jobsThisWeek', count(*) FILTER (
        WHERE found_at >= statement_timestamp() - interval '168 hours'
          AND found_at <= statement_timestamp()
      )
    )
    FROM public.jobs
    WHERE user_id = (SELECT auth.uid());
  $function$;

  REVOKE ALL ON FUNCTION public.dashboard_stats() FROM PUBLIC, anon;
  GRANT EXECUTE ON FUNCTION public.dashboard_stats() TO authenticated;

  INSERT INTO nextrole_internal.schema_migrations(version) VALUES ('202611230001_dashboard_stats');
END;
$migration$;
