import { api } from './client';
import type { HealthCheck, AuditLog, AuditLogFilters, PaginatedResponse } from '@/types';

function buildQueryString(params: AuditLogFilters): string {
  const searchParams = new URLSearchParams();
  if (params.actor) searchParams.append('actor', params.actor);
  if (params.action) searchParams.append('action', params.action);
  if (params.page !== undefined) searchParams.append('page', String(params.page));
  if (params.pageSize !== undefined) searchParams.append('pageSize', String(params.pageSize));
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export const adminApi = {
  health: () =>
    api.get<HealthCheck>('/admin/health'),
  
  auditLogs: (filters: AuditLogFilters = {}) => {
    const query = buildQueryString(filters);
    return api.get<PaginatedResponse<AuditLog>>(`/admin/audit-logs${query}`);
  },
};
