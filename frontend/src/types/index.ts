// User & Auth Types
export type UserRole = 'applicant' | 'employer' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Job Types
export type EmploymentType = 'full_time' | 'part_time' | 'contract';
export type JobStatus = 'active' | 'archived';

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  employmentType: EmploymentType;
  remote: boolean;
  status: JobStatus;
  createdAt: string;
}

export interface JobFormData {
  title: string;
  company: string;
  location: string;
  description: string;
  employmentType: EmploymentType;
  remote: boolean;
  status: JobStatus;
}

// Application Types
export type ApplicationStatus = 'applied' | 'reviewed' | 'interview' | 'rejected' | 'accepted';

export interface Application {
  id: string;
  jobId: string;
  applicantId: string;
  status: ApplicationStatus;
  createdAt: string;
  aiScreeningScore?: number | null;
  aiScreeningStatus?: ScreeningStatus | null;
}

export interface StatusChange {
  status: ApplicationStatus;
  changedAt: string;
  changedBy: string;
}

// AI Screening Types
export type ScreeningStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ScreeningRecommendation = 'strong_match' | 'good_match' | 'partial_match' | 'weak_match';

export interface AIScreeningSkillsMatch {
  matched: string[];
  missing: string[];
  bonus: string[];
}

export interface AIScreeningResult {
  status: ScreeningStatus;
  score: number | null;
  recommendation: ScreeningRecommendation | null;
  skillsMatch: AIScreeningSkillsMatch | null;
  experienceAssessment: string | null;
  strengths: string[] | null;
  concerns: string[] | null;
  completedAt: string | null;
}

export interface AIScreeningSummary {
  status: ScreeningStatus;
  score: number | null;
  recommendation: ScreeningRecommendation | null;
}

export interface ApplicationDetails {
  application: Application & { resumeText?: string; coverLetter?: string };
  job: Pick<Job, 'id' | 'title' | 'company' | 'location'>;
  statusHistory: StatusChange[];
  aiScreening?: AIScreeningResult | AIScreeningSummary | null;
}

export interface ApplicationFormData {
  jobId: string;
  resumeText: string;
  coverLetter: string;
}

// Admin Types
export type HealthStatus = 'ok' | 'degraded' | 'down';

export interface HealthComponent {
  name: string;
  status: HealthStatus;
  message?: string;
}

export interface HealthCheck {
  status: HealthStatus;
  components: HealthComponent[];
}

export interface MetricsData {
  total_requests: number;
  error_requests: number;
  application_submissions: number;
  status_transitions: number;
  queue_depth: number;
  dlq_size: number;
}

export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  metadata: Record<string, unknown>;
}

// Employer Analytics Types
export interface EmployerAnalytics {
  summary: {
    totalJobs: number;
    totalApplications: number;
    avgAiScore: number;
  };
  statusBreakdown: { status: string; count: number }[];
  topJobs: {
    jobId: string;
    title: string;
    company: string;
    applicationCount: number;
    avgAiScore: number | null;
  }[];
  applicationsOverTime: { date: string; count: number }[];
  scoreDistribution: { range: string; count: number }[];
}

// Pagination Types
export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// Filter Types
export interface JobFilters extends PaginationParams {
  query?: string;
  location?: string;
  company?: string;
}

export interface ApplicationFilters extends PaginationParams {
  status?: ApplicationStatus;
  sortBy?: 'created_at' | 'ai_score';
  minScore?: number;
}

export interface AuditLogFilters extends PaginationParams {
  actor?: string;
  action?: string;
}
