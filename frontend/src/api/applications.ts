import { api, API_BASE_URL, getAccessToken } from './client';
import { generateUUID } from '@/utils/uuid';
import type {
  Application,
  ApplicationDetails,
  ApplicationFormData,
  ApplicationFilters,
  ApplicationStatus,
  PaginatedResponse,
} from '@/types';

function buildQueryString(params: ApplicationFilters): string {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.append('status', params.status);
  if (params.page !== undefined) searchParams.append('page', String(params.page));
  if (params.pageSize !== undefined) searchParams.append('pageSize', String(params.pageSize));
  if (params.sortBy) searchParams.append('sortBy', params.sortBy);
  if (params.minScore !== undefined) searchParams.append('minScore', String(params.minScore));
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export const applicationsApi = {
  // Applicant endpoints
  apply: (data: ApplicationFormData) => {
    const idempotencyKey = generateUUID();
    return api.post<Application>('/applications', data, {
      'Idempotency-Key': idempotencyKey,
    });
  },
  
  listMine: (filters: ApplicationFilters = {}) => {
    const query = buildQueryString(filters);
    return api.get<PaginatedResponse<Application>>(`/applications${query}`);
  },
  
  get: (applicationId: string) =>
    api.get<ApplicationDetails>(`/applications/${applicationId}`),
  
  // Employer endpoints
  listForJob: (jobId: string, filters: ApplicationFilters = {}) => {
    const query = buildQueryString(filters);
    return api.get<PaginatedResponse<Application>>(`/employer/jobs/${jobId}/applications${query}`);
  },
  
  updateStatus: (applicationId: string, status: ApplicationStatus) =>
    api.patch<Application>(`/applications/${applicationId}/status`, { status }),

  parseResume: async (file: File): Promise<{ text: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getAccessToken();
    const res = await fetch(`${API_BASE_URL}/applications/parse-resume`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw { status: res.status, message: err.detail || 'Failed to parse PDF' };
    }
    return res.json();
  },
};
