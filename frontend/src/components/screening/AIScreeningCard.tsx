import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { AIScreeningResult } from '@/types';
import { formatRecommendation } from '@/utils/format';
import { Brain, CheckCircle, XCircle, Sparkles, AlertTriangle, Loader2 } from 'lucide-react';

interface AIScreeningCardProps {
  screening: AIScreeningResult;
}

function ScoreCircle({ score }: { score: number }) {
  const color =
    score >= 70 ? 'text-emerald-600 border-emerald-200 bg-emerald-50' :
    score >= 40 ? 'text-amber-600 border-amber-200 bg-amber-50' :
    'text-red-600 border-red-200 bg-red-50';

  return (
    <div className={`flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full border-2 ${color}`}>
      <div className="text-center">
        <div className="text-2xl font-bold">{score}</div>
        <div className="text-[10px] uppercase tracking-wide opacity-70">Score</div>
      </div>
    </div>
  );
}

function RecommendationBadge({ recommendation }: { recommendation: string }) {
  const variant =
    recommendation === 'strong_match' ? 'default' :
    recommendation === 'good_match' ? 'secondary' :
    recommendation === 'partial_match' ? 'outline' :
    'destructive';

  return (
    <Badge variant={variant} className="text-xs">
      {formatRecommendation(recommendation)}
    </Badge>
  );
}

export function AIScreeningCard({ screening }: AIScreeningCardProps) {
  if (screening.status === 'pending' || screening.status === 'processing') {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Resume Screening
              </h3>
              <p className="text-sm text-muted-foreground">
                AI is analyzing this resume against the job description...
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (screening.status === 'failed') {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Resume Screening
              </h3>
              <p className="text-sm text-muted-foreground">
                AI screening could not be completed. The resume can still be reviewed manually.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-5">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          AI Resume Screening
        </h3>

        {/* Score + Recommendation */}
        <div className="flex items-center gap-5">
          {screening.score !== null && <ScoreCircle score={screening.score} />}
          <div className="space-y-2">
            {screening.recommendation && (
              <RecommendationBadge recommendation={screening.recommendation} />
            )}
            {screening.experienceAssessment && (
              <p className="text-sm text-muted-foreground">
                {screening.experienceAssessment}
              </p>
            )}
          </div>
        </div>

        {/* Skills Breakdown */}
        {screening.skillsMatch && (
          <div className="grid gap-4 sm:grid-cols-3">
            {screening.skillsMatch.matched.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-emerald-700 flex items-center gap-1 mb-2">
                  <CheckCircle className="h-3.5 w-3.5" /> Matched Skills
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {screening.skillsMatch.matched.map((skill) => (
                    <Badge key={skill} variant="outline" className="text-xs border-emerald-200 text-emerald-700 bg-emerald-50">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {screening.skillsMatch.missing.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-red-700 flex items-center gap-1 mb-2">
                  <XCircle className="h-3.5 w-3.5" /> Missing Skills
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {screening.skillsMatch.missing.map((skill) => (
                    <Badge key={skill} variant="outline" className="text-xs border-red-200 text-red-700 bg-red-50">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {screening.skillsMatch.bonus.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-blue-700 flex items-center gap-1 mb-2">
                  <Sparkles className="h-3.5 w-3.5" /> Bonus Skills
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {screening.skillsMatch.bonus.map((skill) => (
                    <Badge key={skill} variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Strengths & Concerns */}
        <div className="grid gap-4 sm:grid-cols-2">
          {screening.strengths && screening.strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-emerald-700 mb-2">Strengths</h4>
              <ul className="space-y-1">
                {screening.strengths.map((item, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">+</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {screening.concerns && screening.concerns.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-amber-700 mb-2">Concerns</h4>
              <ul className="space-y-1">
                {screening.concerns.map((item, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-amber-500 mt-1">!</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
