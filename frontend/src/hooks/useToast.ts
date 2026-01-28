import { toast } from 'sonner';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export function showToast(type: ToastType, message: string) {
  switch (type) {
    case 'success':
      toast.success(message);
      break;
    case 'error':
      toast.error(message);
      break;
    case 'warning':
      toast.warning(message);
      break;
    case 'info':
    default:
      toast.info(message);
      break;
  }
}

export function useToast() {
  return { showToast };
}
