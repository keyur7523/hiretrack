import { api } from './client';
import type { User, UserRole } from '@/types';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  user: User;
}

interface RegisterRequest {
  email: string;
  password: string;
  role: UserRole;
}

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', data),
  
  register: (data: RegisterRequest) =>
    api.post<{ message: string }>('/auth/register', data),
  
  me: () =>
    api.get<User>('/auth/me'),
};
