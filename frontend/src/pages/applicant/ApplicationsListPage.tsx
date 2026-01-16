import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { applicationsApi } from '@/api/applications';
import { useToastContext } from '@/contexts/ToastContext';
import type { Application } from '@/types';
import { formatApplicationStatus, formatDate } from '@/utils/format';

export function ApplicationsListPage() {
  const navigate = useNavigate();
  const { showToast } = useToastContext();
  const [applications, setApplications] = useState<Application[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const fetchApplications = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await applicationsApi.listMine({ page, pageSize });
      setApplications(response.items);
      setTotal(response.total);
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message || 'Failed to load applications.';
      setError(message);
      setApplications([]);
      setTotal(0);
      showToast('error', message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [page, pageSize]);

  const statusVariant = (status: Application['status']) => {
    if (status === 'accepted') return 'default';
    if (status === 'rejected') return 'destructive';
    if (status === 'interview') return 'secondary';
    return 'outline';
  };

  return (
    <PageContainer title="My Applications" description="Track your job applications">
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={`app-skeleton-${index}`} className="h-12 w-full" />
          ))}
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <Button variant="outline" onClick={fetchApplications}>Retry</Button>
          </div>
        </div>
      )}

      {!isLoading && !error && applications.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No applications yet.</p>
        </div>
      )}

      {!isLoading && !error && applications.length > 0 && (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((application) => (
                <TableRow
                  key={application.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/app/applications/${application.id}`)}
                >
                  <TableCell>
                    <div className="text-sm font-medium">Job</div>
                    <div className="text-xs text-muted-foreground">{application.jobId}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(application.status)}>
                      {formatApplicationStatus(application.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(application.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
              <div className="text-sm text-muted-foreground">
                Page {page} of {totalPages} · {total} applications
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
                <select
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setPage(1);
                  }}
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                >
                  {[5, 10, 20].map((size) => (
                    <option key={size} value={size}>{size} / page</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}
