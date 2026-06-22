'use client';

import { Prediction } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, formatProbability, getConfidenceColor } from '@/lib/utils';
import { TrendingUp, Target, Shield, Zap } from 'lucide-react';

interface PredictionCardProps {
  prediction: Prediction;
  showDetails?: boolean;
}

export function PredictionCard({ prediction, showDetails = true }: PredictionCardProps) {
  const confidenceColor = getConfidenceColor(prediction.confidence);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">AI Prediction</CardTitle>
          <Badge variant={prediction.confidence >= 70 ? 'success' : prediction.confidence >= 50 ? 'warning' : 'destructive'}>
            {prediction.confidence.toFixed(0)}% Confidence
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main prediction */}
        <div className="flex items-center justify-center gap-4 text-center">
          <div className="flex-1">
            <div className={cn('text-3xl font-bold', 
              prediction.homeWinProb > prediction.awayWinProb && 'text-green-500'
            )}>
              {Math.round(prediction.homeWinProb * 100)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">Home Win</div>
          </div>
          <div className="flex-1">
            <div className="text-3xl font-bold">
              {Math.round(prediction.drawProb * 100)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">Draw</div>
          </div>
          <div className="flex-1">
            <div className={cn('text-3xl font-bold',
              prediction.awayWinProb > prediction.homeWinProb && 'text-green-500'
            )}>
              {Math.round(prediction.awayWinProb * 100)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">Away Win</div>
          </div>
        </div>

        {/* Predicted score */}
        <div className="flex items-center justify-center gap-2 py-3 border-y">
          <span className="text-4xl font-bold">
            {prediction.predictedHomeScore}
          </span>
          <span className="text-2xl text-muted-foreground">-</span>
          <span className="text-4xl font-bold">
            {prediction.predictedAwayScore}
          </span>
          <span className="ml-2 text-sm text-muted-foreground">predicted</span>
        </div>

        {/* Secondary predictions */}
        {showDetails && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">BTTS</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={prediction.bttsYesProb && prediction.bttsYesProb > 0.5 ? 'text-green-500 font-medium' : ''}>
                  Yes {prediction.bttsYesProb ? formatProbability(prediction.bttsYesProb) : 'N/A'}
                </span>
                <span className="text-muted-foreground">/</span>
                <span className={prediction.bttsNoProb && prediction.bttsNoProb > 0.5 ? 'text-green-500 font-medium' : ''}>
                  No {prediction.bttsNoProb ? formatProbability(prediction.bttsNoProb) : 'N/A'}
                </span>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Goals</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={prediction.over25Prob && prediction.over25Prob > 0.5 ? 'text-green-500 font-medium' : ''}>
                  O2.5 {prediction.over25Prob ? formatProbability(prediction.over25Prob) : 'N/A'}
                </span>
                <span className="text-muted-foreground">/</span>
                <span className={prediction.under25Prob && prediction.under25Prob > 0.5 ? 'text-green-500 font-medium' : ''}>
                  U2.5 {prediction.under25Prob ? formatProbability(prediction.under25Prob) : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Asian Handicap */}
        {prediction.homeHandicap && (
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Asian Handicap</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Home {prediction.homeHandicap}</span>
              <span className={confidenceColor}>
                {prediction.handicapProb ? formatProbability(prediction.handicapProb) : 'N/A'}
              </span>
            </div>
          </div>
        )}

        {/* AI Badge */}
        {prediction.aiGenerated && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Zap className="w-4 h-4" />
            <span>Enhanced with AI Analysis</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
