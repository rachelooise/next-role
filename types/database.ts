export type WorkExperience = {
  company: string;
  job_title: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  responsibilities: string;
};

export type Education = {
  degree: string;
  field_of_study: string;
  institution: string;
  graduation_year: number | null;
};

export type CompanyResearch = {
  companyOverview: string;
  techStack: string[];
  culture: string[];
  whyThisRole: string;
  yourEdge: string[];
  gapsToAddress: string[];
  smartQuestions: string[];
  interviewPrep: string[];
  sources: string[];
};

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  current_title: string | null;
  experience_level: "junior" | "mid" | "senior" | "lead" | null;
  years_experience: number | null;
  skills: string[];
  industries: string[];
  work_experience: WorkExperience[];
  education: Education | null;
  job_titles_seeking: string[];
  remote_preference: "remote" | "onsite" | "hybrid" | "any" | null;
  preferred_locations: string[];
  salary_expectation: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  work_authorization: "citizen" | "permanent_resident" | "visa_required" | null;
  resume_pdf_key: string | null;
  resume_pdf_url: string | null;
  is_complete: boolean;
  completion_percentage: number;
  missing_fields: string[];
  created_at: string;
  updated_at: string;
};

export type AgentRun = {
  id: string;
  user_id: string;
  status: "running" | "completed" | "failed";
  job_title_searched: string;
  location_searched: string | null;
  jobs_found: number;
  started_at: string;
  completed_at: string | null;
};

export type Job = {
  id: string;
  user_id: string;
  run_id: string;
  source: "search";
  external_id: string;
  source_url: string;
  external_apply_url: string;
  title: string;
  company: string;
  location: string | null;
  salary: string | null;
  job_type: string | null;
  about_role: string | null;
  responsibilities: string[];
  requirements: string[];
  nice_to_have: string[];
  benefits: string[];
  about_company: string | null;
  match_score: number;
  match_reason: string | null;
  matched_skills: string[];
  missing_skills: string[];
  company_research: CompanyResearch | null;
  company_researched_at: string | null;
  found_at: string;
};

export type AgentLog = {
  id: string;
  user_id: string;
  run_id: string | null;
  job_id: string | null;
  message: string;
  level: "info" | "success" | "warning" | "error";
  created_at: string;
};

// Row types describe validated application data; validate untrusted JSON on input.
