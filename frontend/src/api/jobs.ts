import { api } from './client';
import type { Job, JobFormData, JobFilters, PaginatedResponse } from '@/types';

function buildQueryString(params: JobFilters): string {
  const searchParams = new URLSearchParams();
  if (params.query) searchParams.append('query', params.query);
  if (params.location) searchParams.append('location', params.location);
  if (params.company) searchParams.append('company', params.company);
  if (params.page !== undefined) searchParams.append('page', String(params.page));
  if (params.pageSize !== undefined) searchParams.append('pageSize', String(params.pageSize));
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export const jobsApi = {
  list: (filters: JobFilters = {}) => {
    const query = buildQueryString(filters);
    return api.get<PaginatedResponse<Job>>(`/jobs${query}`);
  },
  
  get: (jobId: string) =>
    api.get<Job>(`/jobs/${jobId}`),
  
  create: (data: JobFormData) =>
    api.post<Job>('/jobs', data),
  
  update: (jobId: string, data: Partial<JobFormData>) =>
    api.patch<Job>(`/jobs/${jobId}`, data),
};
