import { useEffect } from 'react';
import { setGlobalErrorHandler } from '@/api/client';
import { showToast, useToast, type ToastType } from '@/hooks/useToast';

// Re-export types for backward compatibility
export type { ToastType };

// Backward compatible hook
export function useToastContext() {
  return useToast();
}

// Provider is now a no-op since Sonner's Toaster is in App.tsx
// Kept for backward compatibility with existing imports
export function ToastProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    setGlobalErrorHandler((message) => showToast('error', message));
  }, []);

  return <>{children}</>;
}
