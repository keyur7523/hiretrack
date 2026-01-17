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
}

export interface StatusChange {
  status: ApplicationStatus;
  changedAt: string;
  changedBy: string;
}

export interface ApplicationDetails {
  application: Application & { resumeText?: string; coverLetter?: string };
  job: Pick<Job, 'id' | 'title' | 'company' | 'location'>;
  statusHistory: StatusChange[];
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

export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  metadata: Record<string, unknown>;
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
}

export interface AuditLogFilters extends PaginationParams {
  actor?: string;
  action?: string;
}
