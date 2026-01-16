import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { jobsApi } from '@/api/jobs';
import { useToastContext } from '@/contexts/ToastContext';
import type { EmploymentType, Job, JobStatus } from '@/types';

export function JobEditPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToastContext();
  const [job, setJob] = useState<Job | null>(null);
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('full_time');
  const [remote, setRemote] = useState(false);
  const [status, setStatus] = useState<JobStatus>('active');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchJob = async () => {
    if (!jobId) return;
    setIsLoading(true);
    setApiError('');
    try {
      const response = await jobsApi.get(jobId);
      setJob(response);
      setTitle(response.title);
      setCompany(response.company);
      setLocation(response.location);
      setDescription(response.description);
      setEmploymentType(response.employmentType);
      setRemote(response.remote);
      setStatus(response.status);
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message || 'Failed to load job.';
      setApiError(message);
      showToast('error', message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    if (!title.trim()) nextErrors.title = 'Title is required.';
    if (!company.trim()) nextErrors.company = 'Company is required.';
    if (!location.trim()) nextErrors.location = 'Location is required.';
    if (!description.trim()) nextErrors.description = 'Description is required.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setApiError('');
    if (!jobId) return;
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      await jobsApi.update(jobId, {
        title: title.trim(),
        company: company.trim(),
        location: location.trim(),
        description: description.trim(),
        employmentType,
        remote,
        status,
      });
      showToast('success', 'Job updated.');
      navigate('/app/employer/jobs');
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message || 'Failed to update job.';
      setApiError(message);
      showToast('error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer title="Edit Job">
      {isLoading && (
        <Card>
          <CardContent className="space-y-4 p-6">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      )}

      {!isLoading && apiError && !job && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{apiError}</span>
            <Button variant="outline" onClick={fetchJob}>Retry</Button>
          </div>
        </div>
      )}

      {!isLoading && job && (
        <Card>
          <CardContent className="p-6">
            {apiError && (
              <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {apiError}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input value={title} onChange={(event) => setTitle(event.target.value)} />
                {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Company</label>
                <Input value={company} onChange={(event) => setCompany(event.target.value)} />
                {errors.company && <p className="text-sm text-destructive">{errors.company}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Input value={location} onChange={(event) => setLocation(event.target.value)} />
                {errors.location && <p className="text-sm text-destructive">{errors.location}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={6} />
                {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Employment Type</label>
                  <Select value={employmentType} onValueChange={(value) => setEmploymentType(value as EmploymentType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_time">Full-time</SelectItem>
                      <SelectItem value="part_time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={status} onValueChange={(value) => setStatus(value as JobStatus)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border p-4">
                <div>
                  <p className="text-sm font-medium">Remote role</p>
                  <p className="text-xs text-muted-foreground">Enable if this position is remote friendly.</p>
                </div>
                <Switch checked={remote} onCheckedChange={setRemote} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => navigate('/app/employer/jobs')}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
