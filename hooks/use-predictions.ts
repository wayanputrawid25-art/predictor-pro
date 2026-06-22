'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Prediction } from '@/types';

export function usePrediction(matchId: string) {
  return useQuery({
    queryKey: ['prediction', matchId],
    queryFn: async () => {
      const response = await fetch(`/api/v1/predictions/${matchId}`);
      if (!response.ok) throw new Error('Failed to fetch prediction');
      return response.json();
    },
    staleTime: 300000, // 5 minutes
  });
}

export function useGeneratePrediction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { homeTeamId: string; awayTeamId: string }) => {
      const response = await fetch('/api/v1/predictions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) throw new Error('Failed to generate prediction');
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['prediction', variables.homeTeamId, variables.awayTeamId] });
    },
  });
}
