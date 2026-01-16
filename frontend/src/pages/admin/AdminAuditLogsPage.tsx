import { useEffect, useMemo, useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { adminApi } from '@/api/admin';
import { useToastContext } from '@/contexts/ToastContext';
import type { AuditLog, AuditLogFilters } from '@/types';
import { formatDateTime } from '@/utils/format';

export function AdminAuditLogsPage() {
  const { showToast } = useToastContext();
  const [filters, setFilters] = useState<AuditLogFilters>({ actor: '', action: '' });
  const [appliedFilters, setAppliedFilters] = useState<AuditLogFilters>({});
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const fetchLogs = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await adminApi.auditLogs({ ...appliedFilters, page, pageSize });
      setLogs(response.items);
      setTotal(response.total);
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message || 'Failed to load audit logs.';
      setError(message);
      setLogs([]);
      setTotal(0);
      showToast('error', message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [appliedFilters, page, pageSize]);

  const handleFilterSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setAppliedFilters({
      actor: filters.actor?.trim() || undefined,
      action: filters.action?.trim() || undefined,
    });
    setPage(1);
  };

  return (
    <PageContainer title="Audit Logs">
      <Card className="mb-6">
        <CardContent className="p-4">
          <form onSubmit={handleFilterSubmit} className="grid gap-4 md:grid-cols-3">
            <Input
              placeholder="Filter by actor ID"
              value={filters.actor || ''}
              onChange={(event) => setFilters((prev) => ({ ...prev, actor: event.target.value }))}
            />
            <Input
              placeholder="Filter by action"
              value={filters.action || ''}
              onChange={(event) => setFilters((prev) => ({ ...prev, action: event.target.value }))}
            />
            <Button type="submit">Apply filters</Button>
          </form>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={`audit-skeleton-${index}`} className="h-12 w-full" />
          ))}
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <Button variant="outline" onClick={fetchLogs}>Retry</Button>
          </div>
        </div>
      )}

      {!isLoading && !error && logs.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No audit logs found.</p>
        </div>
      )}

      {!isLoading && !error && logs.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm font-medium">{log.actorId}</TableCell>
                    <TableCell className="text-sm">{log.action}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.entityType} · {log.entityId}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(log.createdAt)}
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
            Page {page} of {totalPages} · {total} logs
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
