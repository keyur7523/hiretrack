import { useEffect, useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { employerApi } from '@/api/employer';
import { useToastContext } from '@/contexts/ToastContext';
import { FadeIn } from '@/components/motion/FadeIn';
import type { EmployerAnalytics } from '@/types';
import { formatApplicationStatus } from '@/utils/format';
import { Briefcase, Users, Brain, TrendingUp } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  applied: 'hsl(210, 85%, 55%)',
  reviewed: 'hsl(38, 92%, 50%)',
  interview: 'hsl(270, 60%, 55%)',
  accepted: 'hsl(142, 70%, 40%)',
  rejected: 'hsl(0, 72%, 51%)',
};

const SCORE_COLORS: Record<string, string> = {
  '0-20': 'hsl(0, 72%, 51%)',
  '21-40': 'hsl(25, 80%, 50%)',
  '41-60': 'hsl(38, 92%, 50%)',
  '61-80': 'hsl(142, 50%, 50%)',
  '81-100': 'hsl(142, 70%, 40%)',
};

export function EmployerDashboardPage() {
  const { showToast } = useToastContext();
  const [data, setData] = useState<EmployerAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await employerApi.getAnalytics();
      setData(response);
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message || 'Failed to load analytics.';
      setError(message);
      showToast('error', message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <PageContainer title="Dashboard">
      {isLoading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={`summary-skeleton-${i}`} className="h-24 w-full rounded-lg" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Skeleton className="h-72 w-full rounded-lg" />
            <Skeleton className="h-72 w-full rounded-lg" />
          </div>
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <Button variant="outline" onClick={fetchAnalytics}>Retry</Button>
          </div>
        </div>
      )}

      {!isLoading && !error && data && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <FadeIn>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard
                icon={<Briefcase className="w-5 h-5" />}
                label="Total Jobs"
                value={data.summary.totalJobs}
                iconBg="bg-blue-100 text-blue-600"
              />
              <SummaryCard
                icon={<Users className="w-5 h-5" />}
                label="Applications"
                value={data.summary.totalApplications}
                iconBg="bg-violet-100 text-violet-600"
              />
              <SummaryCard
                icon={<Brain className="w-5 h-5" />}
                label="Avg AI Score"
                value={data.summary.avgAiScore}
                suffix="/100"
                iconBg="bg-emerald-100 text-emerald-600"
              />
              <SummaryCard
                icon={<TrendingUp className="w-5 h-5" />}
                label="Acceptance Rate"
                value={getAcceptanceRate(data.statusBreakdown)}
                suffix="%"
                iconBg="bg-amber-100 text-amber-600"
              />
            </div>
          </FadeIn>

          {/* Charts Row 1: Applications Over Time + Status Breakdown */}
          <FadeIn delay={0.1}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Applications Over Time */}
              <Card className="lg:col-span-2">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Applications Over Time</h3>
                  {data.applicationsOverTime.length > 0 ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <AreaChart data={data.applicationsOverTime}>
                        <defs>
                          <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(210, 85%, 55%)" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="hsl(210, 85%, 55%)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 11, fill: 'hsl(220, 10%, 45%)' }}
                          tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: 'hsl(220, 10%, 45%)' }}
                          allowDecimals={false}
                        />
                        <Tooltip
                          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(220, 13%, 91%)' }}
                          labelFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke="hsl(210, 85%, 55%)"
                          strokeWidth={2}
                          fill="url(#colorApps)"
                          name="Applications"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-60 flex items-center justify-center text-sm text-muted-foreground">
                      No application data yet
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Status Breakdown */}
              <Card>
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Status Breakdown</h3>
                  {data.statusBreakdown.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie
                            data={data.statusBreakdown}
                            dataKey="count"
                            nameKey="status"
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={75}
                            strokeWidth={2}
                            stroke="hsl(0, 0%, 100%)"
                          >
                            {data.statusBreakdown.map((entry) => (
                              <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#999'} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(220, 13%, 91%)' }}
                            formatter={(value: number, name: string) => [value, formatApplicationStatus(name)]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center mt-2">
                        {data.statusBreakdown.map((entry) => (
                          <div key={entry.status} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[entry.status] }} />
                            {formatApplicationStatus(entry.status)} ({entry.count})
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="h-60 flex items-center justify-center text-sm text-muted-foreground">
                      No data yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </FadeIn>

          {/* Charts Row 2: Score Distribution + Top Jobs */}
          <FadeIn delay={0.2}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* AI Score Distribution */}
              <Card>
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4">AI Score Distribution</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={data.scoreDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                      <XAxis dataKey="range" tick={{ fontSize: 11, fill: 'hsl(220, 10%, 45%)' }} />
                      <YAxis tick={{ fontSize: 11, fill: 'hsl(220, 10%, 45%)' }} allowDecimals={false} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(220, 13%, 91%)' }} />
                      <Bar dataKey="count" name="Applicants" radius={[4, 4, 0, 0]}>
                        {data.scoreDistribution.map((entry) => (
                          <Cell key={entry.range} fill={SCORE_COLORS[entry.range] || '#999'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Jobs */}
              <Card>
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Top Jobs by Applications</h3>
                  {data.topJobs.length > 0 ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={data.topJobs} layout="vertical" margin={{ left: 0, right: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                        <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(220, 10%, 45%)' }} allowDecimals={false} />
                        <YAxis
                          type="category"
                          dataKey="title"
                          tick={{ fontSize: 10, fill: 'hsl(220, 10%, 45%)' }}
                          width={130}
                          tickFormatter={(v) => v.length > 18 ? v.slice(0, 18) + '...' : v}
                        />
                        <Tooltip
                          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(220, 13%, 91%)' }}
                          formatter={(value: number, name: string) => {
                            if (name === 'Applications') return [value, name];
                            return [value, name];
                          }}
                          labelFormatter={(label) => {
                            const job = data.topJobs.find((j) => j.title === label);
                            return job ? `${job.title} at ${job.company}` : label;
                          }}
                        />
                        <Bar dataKey="applicationCount" name="Applications" fill="hsl(210, 85%, 55%)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-60 flex items-center justify-center text-sm text-muted-foreground">
                      No jobs with applications yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </FadeIn>
        </div>
      )}
    </PageContainer>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  suffix,
  iconBg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  iconBg: string;
}) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        <div>
          <div className="text-[12px] text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold tracking-tight text-foreground">
            {value}{suffix && <span className="text-sm font-normal text-muted-foreground">{suffix}</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getAcceptanceRate(statusBreakdown: { status: string; count: number }[]): number {
  const total = statusBreakdown.reduce((sum, s) => sum + s.count, 0);
  const accepted = statusBreakdown.find((s) => s.status === 'accepted')?.count || 0;
  if (total === 0) return 0;
  return Math.round((accepted / total) * 100);
}
