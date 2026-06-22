'use client';

import { useQuery } from '@tanstack/react-query';
import { Match } from '@/types';

interface UseMatchesOptions {
  date?: string;
  leagueId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  refetchInterval?: number;
}

export function useMatches(options: UseMatchesOptions = {}) {
  const { date, leagueId, status, page = 1, pageSize = 20, refetchInterval } = options;

  return useQuery({
    queryKey: ['matches', { date, leagueId, status, page, pageSize }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (date) params.set('date', date);
      if (leagueId) params.set('leagueId', leagueId);
      if (status) params.set('status', status);
      params.set('page', page.toString());
      params.set('pageSize', pageSize.toString());

      const response = await fetch(`/api/v1/matches?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch matches');
      return response.json();
    },
    refetchInterval,
    staleTime: 60000, // 1 minute
  });
}

export function useLiveMatches() {
  return useQuery({
    queryKey: ['matches', 'live'],
    queryFn: async () => {
      const response = await fetch('/api/v1/matches/live');
      if (!response.ok) throw new Error('Failed to fetch live matches');
      return response.json();
    },
    refetchInterval: 30000, // 30 seconds for live matches
    staleTime: 15000,
  });
}

export function useTodayMatches() {
  return useQuery({
    queryKey: ['matches', 'today'],
    queryFn: async () => {
      const response = await fetch('/api/v1/matches/today');
      if (!response.ok) throw new Error('Failed to fetch today matches');
      return response.json();
    },
    refetchInterval: 300000, // 5 minutes
    staleTime: 60000,
  });
}

export function useUpcomingMatches(daysAhead: number = 7) {
  return useQuery({
    queryKey: ['matches', 'upcoming', daysAhead],
    queryFn: async () => {
      const response = await fetch(`/api/v1/matches/upcoming?days=${daysAhead}`);
      if (!response.ok) throw new Error('Failed to fetch upcoming matches');
      return response.json();
    },
    staleTime: 300000,
  });
}

export function useMatch(id: string) {
  return useQuery({
    queryKey: ['match', id],
    queryFn: async () => {
      const response = await fetch(`/api/v1/matches/${id}`);
      if (!response.ok) throw new Error('Failed to fetch match');
      return response.json();
    },
    staleTime: 60000,
  });
}

export function useHeadToHead(homeTeamId: string, awayTeamId: string) {
  return useQuery({
    queryKey: ['h2h', homeTeamId, awayTeamId],
    queryFn: async () => {
      const response = await fetch(`/api/v1/h2h?home=${homeTeamId}&away=${awayTeamId}`);
      if (!response.ok) throw new Error('Failed to fetch head to head');
      return response.json();
    },
    staleTime: 300000,
  });
}
