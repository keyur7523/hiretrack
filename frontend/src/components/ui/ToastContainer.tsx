import { useToastContext } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';

export function ToastContainer() {
  const { toasts, removeToast } = useToastContext();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-16 lg:bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'px-4 py-3 rounded-md shadow-md border-l-4 bg-background animate-slide-in-right',
            {
              'border-l-success': toast.type === 'success',
              'border-l-destructive': toast.type === 'error',
              'border-l-warning': toast.type === 'warning',
              'border-l-info': toast.type === 'info',
            }
          )}
        >
          <div className="flex items-start gap-3">
            <p className="text-sm flex-1">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-muted-foreground hover:text-foreground"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
