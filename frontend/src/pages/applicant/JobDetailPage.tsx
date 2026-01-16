import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { jobsApi } from '@/api/jobs';
import { applicationsApi } from '@/api/applications';
import { useToastContext } from '@/contexts/ToastContext';
import type { Job } from '@/types';
import { formatDate, formatEmploymentType } from '@/utils/format';

export function JobDetailPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToastContext();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [applyError, setApplyError] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const fetchJob = async () => {
    if (!jobId) return;
    setIsLoading(true);
    setError('');
    try {
      const response = await jobsApi.get(jobId);
      setJob(response);
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message || 'Failed to load job details.';
      setError(message);
      showToast('error', message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  const handleApplySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!jobId) return;
    if (!resumeText.trim()) {
      setApplyError('Resume text is required.');
      return;
    }
    setApplyError('');
    setIsApplying(true);
    try {
      const response = await applicationsApi.apply({
        jobId,
        resumeText: resumeText.trim(),
        coverLetter: coverLetter.trim(),
      });
      showToast('success', 'Application submitted.');
      setIsApplyOpen(false);
      navigate(`/app/applications/${response.id}`);
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message || 'Failed to submit application.';
      setApplyError(message);
      showToast('error', message);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <PageContainer title="Job Details">
      {isLoading && (
        <Card>
          <CardContent className="space-y-4 p-6">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
      )}

      {!isLoading && error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <Button variant="outline" onClick={fetchJob}>Retry</Button>
          </div>
        </div>
      )}

      {!isLoading && !error && job && (
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">{job.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {job.company} · {job.location}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{formatEmploymentType(job.employmentType)}</Badge>
                  {job.remote && <Badge variant="outline">Remote</Badge>}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Posted {formatDate(job.createdAt)}</p>
              <div className="prose prose-sm max-w-none text-foreground">
                <p className="whitespace-pre-line">{job.description}</p>
              </div>
            </CardContent>
          </Card>

          <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
            <DialogTrigger asChild>
              <Button>Apply for this job</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Apply to {job.title}</DialogTitle>
                <DialogDescription>
                  Share your resume text and a cover letter to complete your application.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleApplySubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Resume Text</label>
                  <Textarea
                    value={resumeText}
                    onChange={(event) => setResumeText(event.target.value)}
                    placeholder="Paste your resume text here"
                    required
                    rows={6}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cover Letter (optional)</label>
                  <Textarea
                    value={coverLetter}
                    onChange={(event) => setCoverLetter(event.target.value)}
                    placeholder="Add a short cover letter"
                    rows={4}
                  />
                </div>
                {applyError && (
                  <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    {applyError}
                  </div>
                )}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsApplyOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isApplying}>
                    {isApplying ? 'Submitting...' : 'Submit Application'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {!isLoading && !error && !job && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Job not found.</p>
        </div>
      )}
    </PageContainer>
  );
}
