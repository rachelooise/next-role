DO $migration$
BEGIN

-- Restrictive policies intersect with InsForge's existing permissive owner policies.
CREATE POLICY nextrole_resume_path_owner ON storage.objects
AS RESTRICTIVE FOR ALL TO authenticated
USING (
  bucket <> 'resumes' OR (
    key = (SELECT auth.uid())::text || '/resume.pdf'
    AND uploaded_by = (SELECT auth.uid())::text
  )
)
WITH CHECK (
  bucket <> 'resumes' OR (
    key = (SELECT auth.uid())::text || '/resume.pdf'
    AND uploaded_by = (SELECT auth.uid())::text
  )
);

CREATE POLICY nextrole_resumes_no_anonymous ON storage.objects
AS RESTRICTIVE FOR ALL TO anon
USING (bucket <> 'resumes') WITH CHECK (bucket <> 'resumes');

INSERT INTO nextrole_internal.schema_migrations(version) VALUES ('202610310002_resume_ownership');
END;
$migration$;
