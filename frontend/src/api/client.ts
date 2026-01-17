const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

interface ApiError {
  status: number;
  message: string;
}

type RequestMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

interface RequestOptions {
  method?: RequestMethod;
  body?: unknown;
  headers?: Record<string, string>;
}

let globalLogoutHandler: (() => void) | null = null;
let globalUnauthorizedHandler: (() => void) | null = null;
let globalErrorHandler: ((message: string) => void) | null = null;

export function setGlobalLogoutHandler(handler: () => void) {
  globalLogoutHandler = handler;
}

export function setGlobalUnauthorizedHandler(handler: () => void) {
  globalUnauthorizedHandler = handler;
}

export function setGlobalErrorHandler(handler: (message: string) => void) {
  globalErrorHandler = handler;
}

function getAccessToken(): string | null {
  return localStorage.getItem('accessToken');
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;
  
  const token = getAccessToken();
  
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };
  
  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        globalLogoutHandler?.();
        throw { status: 401, message: 'Session expired. Please login again.' } as ApiError;
      }
      
      if (response.status === 403) {
        globalUnauthorizedHandler?.();
        throw { status: 403, message: 'You do not have permission to access this resource.' } as ApiError;
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw {
        status: response.status,
        message: errorData.message || `Request failed with status ${response.status}`,
      } as ApiError;
    }
    
    // Handle empty responses
    const text = await response.text();
    if (!text) return {} as T;
    
    return JSON.parse(text) as T;
  } catch (error) {
    if ((error as ApiError).status) {
      throw error;
    }
    
    const networkError = 'Network error. Please try again.';
    globalErrorHandler?.(networkError);
    throw { status: 0, message: networkError } as ApiError;
  }
}

export function createApiClient() {
  return {
    get: <T>(endpoint: string, headers?: Record<string, string>) =>
      apiClient<T>(endpoint, { method: 'GET', headers }),
    
    post: <T>(endpoint: string, body?: unknown, headers?: Record<string, string>) =>
      apiClient<T>(endpoint, { method: 'POST', body, headers }),
    
    patch: <T>(endpoint: string, body?: unknown, headers?: Record<string, string>) =>
      apiClient<T>(endpoint, { method: 'PATCH', body, headers }),
    
    put: <T>(endpoint: string, body?: unknown, headers?: Record<string, string>) =>
      apiClient<T>(endpoint, { method: 'PUT', body, headers }),
    
    delete: <T>(endpoint: string, headers?: Record<string, string>) =>
      apiClient<T>(endpoint, { method: 'DELETE', headers }),
  };
}

export const api = createApiClient();
