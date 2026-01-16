import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { applicationsApi } from '@/api/applications';
import { useToastContext } from '@/contexts/ToastContext';
import type { ApplicationDetails } from '@/types';
import { formatApplicationStatus, formatDateTime } from '@/utils/format';

export function ApplicationDetailPage() {
  const { applicationId } = useParams();
  const { showToast } = useToastContext();
  const [details, setDetails] = useState<ApplicationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDetails = async () => {
    if (!applicationId) return;
    setIsLoading(true);
    setError('');
    try {
      const response = await applicationsApi.get(applicationId);
      setDetails(response);
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message || 'Failed to load application details.';
      setError(message);
      showToast('error', message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [applicationId]);

  const statusVariant = (status: ApplicationDetails['application']['status']) => {
    if (status === 'accepted') return 'default';
    if (status === 'rejected') return 'destructive';
    if (status === 'interview') return 'secondary';
    return 'outline';
  };

  return (
    <PageContainer title="Application Details">
      {isLoading && (
        <Card>
          <CardContent className="space-y-4 p-6">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      )}

      {!isLoading && error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <Button variant="outline" onClick={fetchDetails}>Retry</Button>
          </div>
        </div>
      )}

      {!isLoading && !error && details && (
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div>
                <h2 className="text-xl font-semibold">{details.job.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {details.job.company} · {details.job.location}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Current status</span>
                <Badge variant={statusVariant(details.application.status)}>
                  {formatApplicationStatus(details.application.status)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <h3 className="text-lg font-semibold">Status History</h3>
              <div className="space-y-3">
                {details.statusHistory
                  .slice()
                  .sort((a, b) => a.changedAt.localeCompare(b.changedAt))
                  .map((entry) => (
                    <div key={`${entry.status}-${entry.changedAt}`} className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                      <div>
                        <p className="text-sm font-medium">
                          {formatApplicationStatus(entry.status)} · {formatDateTime(entry.changedAt)}
                        </p>
                        <p className="text-xs text-muted-foreground">Updated by {entry.changedBy}</p>
                      </div>
                    </div>
                  ))}
                {details.statusHistory.length === 0 && (
                  <p className="text-sm text-muted-foreground">No status changes recorded yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!isLoading && !error && !details && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Application not found.</p>
        </div>
      )}
    </PageContainer>
  );
}
