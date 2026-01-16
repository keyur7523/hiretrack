import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { jobsApi } from '@/api/jobs';
import { useToastContext } from '@/contexts/ToastContext';
import type { Job, JobFilters } from '@/types';
import { formatDate, formatEmploymentType } from '@/utils/format';

export function JobsListPage() {
  const { showToast } = useToastContext();
  const [filters, setFilters] = useState<JobFilters>({
    query: '',
    location: '',
    company: '',
  });
  const [appliedFilters, setAppliedFilters] = useState<JobFilters>({});
  const [jobs, setJobs] = useState<Job[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const fetchJobs = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await jobsApi.list({ ...appliedFilters, page, pageSize });
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
  }, [appliedFilters, page, pageSize]);

  const handleFilterChange = (field: keyof JobFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleFilterSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setAppliedFilters({
      query: filters.query?.trim() || undefined,
      location: filters.location?.trim() || undefined,
      company: filters.company?.trim() || undefined,
    });
    setPage(1);
  };

  return (
    <PageContainer title="Find Jobs" description="Search and apply for jobs">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFilterSubmit} className="grid gap-4 md:grid-cols-4">
            <Input
              placeholder="Search by title or keyword"
              value={filters.query || ''}
              onChange={(event) => handleFilterChange('query', event.target.value)}
            />
            <Input
              placeholder="Location"
              value={filters.location || ''}
              onChange={(event) => handleFilterChange('location', event.target.value)}
            />
            <Input
              placeholder="Company"
              value={filters.company || ''}
              onChange={(event) => handleFilterChange('company', event.target.value)}
            />
            <div className="flex items-center gap-2">
              <Button type="submit" className="w-full">Search</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={`job-skeleton-${index}`}>
              <CardHeader>
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
            </Card>
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
          <p>No jobs found.</p>
        </div>
      )}

      {!isLoading && !error && jobs.length > 0 && (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job.id} className="transition hover:border-primary/40">
              <CardHeader>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      <Link to={`/app/jobs/${job.id}`} className="hover:underline">
                        {job.title}
                      </Link>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {job.company} · {job.location}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{formatEmploymentType(job.employmentType)}</Badge>
                    {job.remote && <Badge variant="outline">Remote</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Posted {formatDate(job.createdAt)}</span>
                  <Button asChild variant="ghost" size="sm">
                    <Link to={`/app/jobs/${job.id}`}>View details</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
