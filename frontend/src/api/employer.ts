import { api } from './client';
import type { EmployerAnalytics } from '@/types';

export const employerApi = {
  getAnalytics: () => api.get<EmployerAnalytics>('/employer/analytics'),
};
