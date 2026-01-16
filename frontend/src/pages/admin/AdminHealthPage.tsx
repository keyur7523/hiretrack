import { useEffect, useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { adminApi } from '@/api/admin';
import { useToastContext } from '@/contexts/ToastContext';
import type { HealthCheck, HealthStatus } from '@/types';

export function AdminHealthPage() {
  const { showToast } = useToastContext();
  const [health, setHealth] = useState<HealthCheck | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHealth = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await adminApi.health();
      setHealth(response);
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message || 'Failed to load system health.';
      setError(message);
      setHealth(null);
      showToast('error', message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const statusStyles = (status: HealthStatus) => {
    if (status === 'ok') return 'bg-success-soft text-success';
    if (status === 'degraded') return 'bg-warning-soft text-warning';
    return 'bg-destructive/10 text-destructive';
  };

  return (
    <PageContainer title="System Health">
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={`health-skeleton-${index}`} className="h-24 w-full" />
            ))}
          </div>
        </div>
      )}

      {!isLoading && error && (
        <div className="space-y-4">
          <div className={`rounded-md px-4 py-3 text-sm font-medium ${statusStyles('degraded')}`}>
            System status: degraded
          </div>
          <Card>
            <CardContent className="flex flex-col gap-3 p-6">
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" onClick={fetchHealth}>Retry</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {!isLoading && !error && health && (
        <div className="space-y-6">
          <div className={`rounded-md px-4 py-3 text-sm font-medium ${statusStyles(health.status)}`}>
            System status: {health.status}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {health.components.map((component) => (
              <Card key={component.name}>
                <CardContent className="space-y-2 p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">{component.name}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyles(component.status)}`}>
                      {component.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {component.message || 'No additional details provided.'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          {health.components.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No component checks available.</p>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}
