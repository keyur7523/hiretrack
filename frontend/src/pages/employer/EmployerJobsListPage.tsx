import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { jobsApi } from '@/api/jobs';
import { useToastContext } from '@/contexts/ToastContext';
import type { Job } from '@/types';
import { formatEmploymentType } from '@/utils/format';

export function EmployerJobsListPage() {
  const { showToast } = useToastContext();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingJobId, setUpdatingJobId] = useState<string | null>(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const fetchJobs = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await jobsApi.list({ page, pageSize });
      setJobs(response.items);
      setTotal(response.total);
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message || 'Failed to load jobs.';
      setError(message);
      setJobs([]);
      setTotal(0);
      showToast('error', message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page, pageSize]);

  const handleToggleStatus = async (job: Job) => {
    const nextStatus = job.status === 'active' ? 'archived' : 'active';
    setUpdatingJobId(job.id);
    setJobs((prev) =>
      prev.map((item) => (item.id === job.id ? { ...item, status: nextStatus } : item))
    );
    try {
      await jobsApi.update(job.id, { status: nextStatus });
      showToast('success', `Job ${nextStatus === 'active' ? 'activated' : 'archived'}.`);
    } catch (err: unknown) {
      setJobs((prev) =>
        prev.map((item) => (item.id === job.id ? { ...item, status: job.status } : item))
      );
      const message = (err as { message?: string })?.message || 'Failed to update job status.';
      showToast('error', message);
    } finally {
      setUpdatingJobId(null);
    }
  };

  const statusVariant = (status: Job['status']) =>
    status === 'active' ? 'default' : 'outline';

  return (
    <PageContainer
      title="Manage Jobs"
      actions={
        <Button asChild>
          <Link to="/app/employer/jobs/create">Create Job</Link>
        </Button>
      }
    >
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={`job-skeleton-${index}`} className="h-12 w-full" />
          ))}
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <Button variant="outline" onClick={fetchJobs}>Retry</Button>
          </div>
        </div>
      )}

      {!isLoading && !error && jobs.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No jobs created yet.</p>
        </div>
      )}

      {!isLoading && !error && jobs.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div className="text-sm font-medium">{job.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {job.company} · {job.location}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatEmploymentType(job.employmentType)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(job.status)}>
                        {job.status === 'active' ? 'Active' : 'Archived'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button asChild size="sm" variant="ghost">
                        <Link to={`/app/employer/jobs/${job.id}/applications`}>Applications</Link>
                      </Button>
                      <Button asChild size="sm" variant="ghost">
                        <Link to={`/app/employer/jobs/${job.id}/edit`}>Edit</Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleStatus(job)}
                        disabled={updatingJobId === job.id}
                      >
                        {job.status === 'active' ? 'Archive' : 'Activate'}
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
            Page {page} of {totalPages} · {total} jobs
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
