# NextRole backend migrations

The connected InsForge project is the existing NextRole backend. Never reinitialize it.

Apply migrations once, in filename order, through InsForge infrastructure tooling. Each file is one atomic PostgreSQL DO statement; explicit transaction commands are rejected by this MCP server. Verify nextrole_internal.schema_migrations before applying a file. Applied versions must never be edited and replayed; use a new forward migration for subsequent changes.

1. 202610310001_application_schema.sql creates four application tables, constraints, indexes, timestamp trigger, RLS policies, grants, and the private migration ledger.
2. 202610310002_resume_ownership.sql adds restrictive storage policies that intersect with InsForge's existing uploaded_by ownership policies. It does not alter access to other buckets.
3. Provision the resumes bucket through create-bucket with isPublic false. Bucket provisioning is separate from SQL and must be verified separately. Never change an existing private bucket to public.

Both migrations and the private bucket were applied on 2026-10-31. See context/database-design.md for the approved design and context/database-verification.md for live SDK/API evidence and controlled fixture procedures. Shared application row types are in types/database.ts.
