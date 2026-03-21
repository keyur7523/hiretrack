import { useEffect, useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { adminApi, type MetricsData } from '@/api/admin';
import { useToastContext } from '@/contexts/ToastContext';

const metricLabels: Record<string, string> = {
  total_requests: 'Total Requests',
  error_requests: 'Error Requests',
  application_submissions: 'Application Submissions',
  status_transitions: 'Status Transitions',
  queue_depth: 'Queue Depth',
  dlq_size: 'Dead Letter Queue',
};

export function AdminMetricsPage() {
  const { showToast } = useToastContext();
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMetrics = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await adminApi.metrics();
      setMetrics(response);
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message || 'Failed to load metrics.';
      setError(message);
      setMetrics(null);
      showToast('error', message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <PageContainer title="System Metrics">
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={`metrics-skeleton-${index}`} className="h-24 w-full" />
          ))}
        </div>
      )}

      {!isLoading && error && (
        <Card>
          <CardContent className="flex flex-col gap-3 p-6">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={fetchMetrics}>Retry</Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && metrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(metricLabels).map(([key, label]) => (
            <Card key={key}>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-semibold mt-1">
                  {metrics[key as keyof MetricsData] ?? 0}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
