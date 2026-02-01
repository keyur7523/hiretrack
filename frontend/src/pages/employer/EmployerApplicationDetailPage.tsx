import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { applicationsApi } from '@/api/applications';
import { useToastContext } from '@/contexts/ToastContext';
import type { ApplicationDetails, ApplicationStatus } from '@/types';
import { formatApplicationStatus, formatDateTime } from '@/utils/format';

export function EmployerApplicationDetailPage() {
  const { applicationId } = useParams();
  const { showToast } = useToastContext();
  const [details, setDetails] = useState<ApplicationDetails | null>(null);
  const [currentStatus, setCurrentStatus] = useState<ApplicationStatus>('applied');
  const [pendingStatus, setPendingStatus] = useState<ApplicationStatus | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchDetails = async () => {
    if (!applicationId) return;
    setIsLoading(true);
    setError('');
    try {
      const response = await applicationsApi.get(applicationId);
      setDetails(response);
      setCurrentStatus(response.application.status);
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message || 'Failed to load application.';
      setError(message);
      showToast('error', message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [applicationId]);

  const handleStatusChange = (value: string) => {
    const nextStatus = value as ApplicationStatus;
    if (nextStatus === currentStatus) return;
    setPendingStatus(nextStatus);
    setIsConfirmOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!pendingStatus || !applicationId) {
      setIsConfirmOpen(false);
      return;
    }
    setIsUpdating(true);
    try {
      await applicationsApi.updateStatus(applicationId, pendingStatus);
      showToast('success', 'Application status updated.');
      await fetchDetails();
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message || 'Failed to update status.';
      showToast('error', message);
    } finally {
      setIsUpdating(false);
      setIsConfirmOpen(false);
      setPendingStatus(null);
    }
  };

  const statusVariant = (status: ApplicationStatus) => {
    if (status === 'accepted') return 'default';
    if (status === 'rejected') return 'destructive';
    if (status === 'interview') return 'secondary';
    return 'outline';
  };

  // Valid status transitions based on backend rules
  const validTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
    applied: ['reviewed', 'rejected'],
    reviewed: ['interview', 'rejected'],
    interview: ['accepted', 'rejected'],
    accepted: [],
    rejected: [],
  };

  const availableStatuses = validTransitions[currentStatus] || [];

  return (
    <PageContainer title="Application Review">
      {isLoading && (
        <Card>
          <CardContent className="space-y-4 p-6">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-32 w-full" />
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
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{details.job.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {details.job.company} · {details.job.location}
                  </p>
                </div>
                <Badge variant={statusVariant(details.application.status)}>
                  {formatApplicationStatus(details.application.status)}
                </Badge>
              </div>
              {availableStatuses.length > 0 ? (
                <div className="max-w-xs space-y-2">
                  <label className="text-sm font-medium">Update status</label>
                  <Select value="" onValueChange={handleStatusChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select next status..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {formatApplicationStatus(status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Status is final and cannot be changed.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <h3 className="text-lg font-semibold">Resume Text</h3>
              <p className="whitespace-pre-line text-sm text-muted-foreground">
                {details.application.resumeText?.trim()
                  ? details.application.resumeText
                  : 'No resume text provided.'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <h3 className="text-lg font-semibold">Cover Letter</h3>
              <p className="whitespace-pre-line text-sm text-muted-foreground">
                {details.application.coverLetter?.trim()
                  ? details.application.coverLetter
                  : 'No cover letter provided.'}
              </p>
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

      <AlertDialog open={isConfirmOpen} onOpenChange={(open) => {
        setIsConfirmOpen(open);
        if (!open) setPendingStatus(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm status change</AlertDialogTitle>
            <AlertDialogDescription>
              Update this application to {pendingStatus ? formatApplicationStatus(pendingStatus) : 'the new status'}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange} disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
