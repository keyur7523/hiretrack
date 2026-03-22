import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { AIScreeningSummary } from '@/types';
import { formatRecommendation } from '@/utils/format';
import { Brain, AlertTriangle, Loader2 } from 'lucide-react';

interface AIScreeningSummaryCardProps {
  screening: AIScreeningSummary;
}

export function AIScreeningSummaryCard({ screening }: AIScreeningSummaryCardProps) {
  if (screening.status === 'pending' || screening.status === 'processing') {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI Screening
              </h3>
              <p className="text-xs text-muted-foreground">Your resume is being analyzed...</p>
            </div>
          </div>
          <Skeleton className="mt-3 h-4 w-1/3" />
        </CardContent>
      </Card>
    );
  }

  if (screening.status === 'failed') {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <p className="text-sm text-muted-foreground">AI screening could not be completed.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const scoreColor =
    (screening.score ?? 0) >= 70 ? 'text-emerald-600' :
    (screening.score ?? 0) >= 40 ? 'text-amber-600' :
    'text-red-600';

  const recVariant =
    screening.recommendation === 'strong_match' ? 'default' as const :
    screening.recommendation === 'good_match' ? 'secondary' as const :
    screening.recommendation === 'partial_match' ? 'outline' as const :
    'destructive' as const;

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <Brain className="h-4 w-4 text-primary" />
          AI Screening Result
        </h3>
        <div className="flex items-center gap-4">
          {screening.score !== null && (
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-bold ${scoreColor}`}>{screening.score}</span>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
          )}
          {screening.recommendation && (
            <Badge variant={recVariant}>
              {formatRecommendation(screening.recommendation)}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
