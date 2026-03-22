'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from './use-api-client';

// ─── PLANTS ───────────────────────────────────────────────────────────────────

interface PlantsQuery {
  page?: number;
  limit?: number;
  batch_id?: string;
  zone_id?: string;
  stage?: string;
  is_active?: string;
}

export function usePlants(query: PlantsQuery = {}) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['plants', query],
    queryFn: async () => {
      const res = await api.cultivation.plants.list({ query: { page: 1, limit: 20, ...query } });
      if (res.status !== 200) throw new Error('Failed to load plants');
      return res.body;
    },
  });
}

export function usePlant(id: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['plants', id],
    queryFn: async () => {
      const res = await api.cultivation.plants.getById({ params: { id } });
      if (res.status !== 200) throw new Error('Failed to load plant');
      return res.body;
    },
    enabled: !!id,
  });
}

export function useCreatePlant() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Parameters<typeof api.cultivation.plants.create>[0]['body']) => {
      const res = await api.cultivation.plants.create({ body });
      if (res.status !== 201) throw new Error('Failed to create plant');
      return res.body;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plants'] }),
  });
}

export function useTransitionPlantStage() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof api.cultivation.plants.transition>[0]['body'];
    }) => {
      const res = await api.cultivation.plants.transition({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to transition stage');
      return res.body;
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['plants', id] });
      qc.invalidateQueries({ queryKey: ['plants'] });
    },
  });
}

export function usePlantStageHistory(id: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['plants', id, 'stages'],
    queryFn: async () => {
      const res = await api.cultivation.plants.getStageHistory({ params: { id } });
      if (res.status !== 200) throw new Error('Failed to load stage history');
      return res.body;
    },
    enabled: !!id,
  });
}

// ─── BATCHES ──────────────────────────────────────────────────────────────────

export function useBatches(query: { page?: number; limit?: number } = {}) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['batches', query],
    queryFn: async () => {
      const res = await api.cultivation.batches.list({ query: { page: 1, limit: 20, ...query } });
      if (res.status !== 200) throw new Error('Failed to load batches');
      return res.body;
    },
  });
}

export function useBatch(id: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['batches', id],
    queryFn: async () => {
      const res = await api.cultivation.batches.getById({ params: { id } });
      if (res.status !== 200) throw new Error('Failed to load batch');
      return res.body;
    },
    enabled: !!id,
  });
}

export function useCreateBatch() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Parameters<typeof api.cultivation.batches.create>[0]['body']) => {
      const res = await api.cultivation.batches.create({ body });
      if (res.status !== 201) throw new Error('Failed to create batch');
      return res.body;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['batches'] }),
  });
}

export function useHarvestBatch() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof api.cultivation.batches.harvest>[0]['body'];
    }) => {
      const res = await api.cultivation.batches.harvest({ params: { id }, body });
      if (res.status !== 201) throw new Error('Failed to record harvest');
      return res.body;
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['batches', id] });
      qc.invalidateQueries({ queryKey: ['batches'] });
      qc.invalidateQueries({ queryKey: ['batches', id, 'harvests'] });
    },
  });
}

export function useBatchHarvests(id: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['batches', id, 'harvests'],
    queryFn: async () => {
      const res = await api.cultivation.batches.getHarvests({ params: { id } });
      if (res.status !== 200) throw new Error('Failed to load harvests');
      return res.body;
    },
    enabled: !!id,
  });
}

// ─── QUALITY — CHANGE CONTROLS ───────────────────────────────────────────────

export function useChangeControls(query: { page?: number; limit?: number } = {}) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['changeControls', query],
    queryFn: async () => {
      const res = await api.quality.listChangeControls({ query: { page: 1, limit: 20, ...query } });
      if (res.status !== 200) throw new Error('Failed to load change controls');
      return res.body;
    },
  });
}

export function useChangeControl(id: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['changeControls', id],
    queryFn: async () => {
      const res = await api.quality.getChangeControl({ params: { id } });
      if (res.status !== 200) throw new Error('Failed to load change control');
      return res.body;
    },
    enabled: !!id,
  });
}

// ─── QUALITY — CAPAs ─────────────────────────────────────────────────────────

export function useCAPAs(query: { page?: number; limit?: number } = {}) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['capas', query],
    queryFn: async () => {
      const res = await api.quality.listCapas({ query: { page: 1, limit: 20, ...query } });
      if (res.status !== 200) throw new Error('Failed to load CAPAs');
      return res.body;
    },
  });
}

export function useCAPA(id: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['capas', id],
    queryFn: async () => {
      const res = await api.quality.getCapa({ params: { id } });
      if (res.status !== 200) throw new Error('Failed to load CAPA');
      return res.body;
    },
    enabled: !!id,
  });
}

// ─── QUALITY — DEVIATIONS ────────────────────────────────────────────────────

export function useDeviations(query: { page?: number; limit?: number } = {}) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['deviations', query],
    queryFn: async () => {
      const res = await api.quality.listDeviations({ query: { page: 1, limit: 20, ...query } });
      if (res.status !== 200) throw new Error('Failed to load deviations');
      return res.body;
    },
  });
}

// ─── FINANCIAL ────────────────────────────────────────────────────────────────

export function useAccounts(query: { page?: number; limit?: number } = {}) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['accounts', query],
    queryFn: async () => {
      const res = await api.financial.listAccounts({ query: { page: 1, limit: 20, ...query } });
      if (res.status !== 200) throw new Error('Failed to load accounts');
      return res.body;
    },
  });
}

// ─── WORKFORCE ────────────────────────────────────────────────────────────────

export function useEmployees(query: { page?: number; limit?: number } = {}) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['employees', query],
    queryFn: async () => {
      const res = await api.workforce.listEmployees({ query: { page: 1, limit: 20, ...query } });
      if (res.status !== 200) throw new Error('Failed to load employees');
      return res.body;
    },
  });
}

export function useTasks(query: { page?: number; limit?: number } = {}) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['tasks', query],
    queryFn: async () => {
      const res = await api.workforce.listTasks({ query: { page: 1, limit: 20, ...query } });
      if (res.status !== 200) throw new Error('Failed to load tasks');
      return res.body;
    },
  });
}

// ─── SPATIAL ──────────────────────────────────────────────────────────────────

export function useZones(query: { page?: number; limit?: number } = {}) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['zones', query],
    queryFn: async () => {
      const res = await api.spatial.listZones({ query: { page: 1, limit: 20, ...query } });
      if (res.status !== 200) throw new Error('Failed to load zones');
      return res.body;
    },
  });
}

// ─── ANALYTICS ────────────────────────────────────────────────────────────────

type KpiCategory = 'WORKFORCE' | 'TRAINING' | 'QUALITY' | 'COMPLIANCE';

export function useKpis(query: { period?: string; category?: KpiCategory } = {}) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['analytics', 'kpis', query],
    queryFn: async () => {
      const res = await api.analytics.getKpis({ query });
      if (res.status !== 200) throw new Error('Failed to load KPIs');
      return res.body;
    },
  });
}
