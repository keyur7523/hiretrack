import { cn } from '@/lib/utils';
import { FadeIn } from '@/components/motion';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageContainer({
  children,
  className,
  title,
  description,
  actions,
}: PageContainerProps) {
  return (
    <FadeIn>
      <div className={cn('max-w-5xl mx-auto', className)}>
        {(title || actions) && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              {title && (
                <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
              )}
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        )}
        {children}
      </div>
    </FadeIn>
  );
}
