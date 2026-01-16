import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { applicationsApi } from '@/api/applications';
import { useToastContext } from '@/contexts/ToastContext';
import type { Application, ApplicationStatus } from '@/types';
import { formatApplicationStatus, formatDate } from '@/utils/format';

export function JobApplicationsListPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToastContext();
  const [applications, setApplications] = useState<Application[]>([]);
  const [status, setStatus] = useState<'all' | ApplicationStatus>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const fetchApplications = async () => {
    if (!jobId) return;
    setIsLoading(true);
    setError('');
    try {
      const response = await applicationsApi.listForJob(jobId, {
        status: status === 'all' ? undefined : status,
        page,
        pageSize,
      });
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
  }, [jobId, status, page, pageSize]);

  const statusVariant = (value: ApplicationStatus) => {
    if (value === 'accepted') return 'default';
    if (value === 'rejected') return 'destructive';
    if (value === 'interview') return 'secondary';
    return 'outline';
  };

  return (
    <PageContainer title="Job Applications">
      <Card className="mb-6">
        <CardContent className="p-4">
          <Tabs value={status} onValueChange={(value) => {
            setStatus(value as typeof status);
            setPage(1);
          }}>
            <TabsList className="flex flex-wrap">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="applied">Applied</TabsTrigger>
              <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
              <TabsTrigger value="interview">Interview</TabsTrigger>
              <TabsTrigger value="accepted">Accepted</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={`job-app-skeleton-${index}`} className="h-12 w-full" />
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
          <p>No applications found for this job.</p>
        </div>
      )}

      {!isLoading && !error && applications.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell className="text-sm font-medium">
                      {application.applicantId}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(application.status)}>
                        {formatApplicationStatus(application.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(application.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/app/employer/applications/${application.id}`)}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && totalPages > 1 && (
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
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
    </PageContainer>
  );
}
