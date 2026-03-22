import { useEffect, useRef, useState } from 'react';
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
import { Upload, FileText, Loader2, X } from 'lucide-react';

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setApplyError('Only PDF files are accepted.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setApplyError('File must be under 5MB.');
      return;
    }
    setSelectedFile(file);
    setApplyError('');
    setIsParsing(true);
    try {
      const result = await applicationsApi.parseResume(file);
      setResumeText(result.text);
      showToast('success', 'Resume text extracted from PDF.');
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message || 'Could not extract text from PDF.';
      setApplyError(message);
      setSelectedFile(null);
    } finally {
      setIsParsing(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setResumeText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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
                {/* PDF Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Upload Resume (PDF)</label>
                  <div className="relative">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="resume-upload"
                    />
                    {!selectedFile ? (
                      <label
                        htmlFor="resume-upload"
                        className="flex items-center justify-center gap-2 w-full rounded-md border-2 border-dashed border-border hover:border-primary/50 bg-surface p-4 cursor-pointer transition-colors text-sm text-muted-foreground hover:text-foreground"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Click to upload PDF resume</span>
                      </label>
                    ) : (
                      <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2.5">
                        {isParsing ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        ) : (
                          <FileText className="w-4 h-4 text-primary" />
                        )}
                        <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
                        {isParsing ? (
                          <span className="text-xs text-muted-foreground">Extracting text...</span>
                        ) : (
                          <button type="button" onClick={clearFile} className="text-muted-foreground hover:text-foreground">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative flex items-center gap-3">
                  <div className="flex-1 border-t border-border" />
                  <span className="text-xs text-muted-foreground">or paste manually</span>
                  <div className="flex-1 border-t border-border" />
                </div>

                {/* Resume Text */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Resume Text</label>
                  <Textarea
                    value={resumeText}
                    onChange={(event) => setResumeText(event.target.value)}
                    placeholder="Paste your resume text here or upload a PDF above"
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
