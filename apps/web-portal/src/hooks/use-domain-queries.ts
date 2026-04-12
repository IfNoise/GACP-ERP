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

export function useBulkCreatePlants() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Parameters<typeof api.cultivation.plants.bulkCreate>[0]['body']) => {
      const res = await api.cultivation.plants.bulkCreate({ body });
      if (res.status !== 201) throw new Error('Failed to bulk-create plants');
      return res.body;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plants'] }),
  });
}

export function useMovePlant() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof api.cultivation.plants.move>[0]['body'];
    }) => {
      const res = await api.cultivation.plants.move({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to move plant');
      return res.body;
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['plants', id] });
      qc.invalidateQueries({ queryKey: ['plants'] });
    },
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

// ─── STRAINS ─────────────────────────────────────────────────────────────────

interface StrainsQuery {
  page?: number;
  limit?: number;
  species?: string;
  supplier_id?: string;
  is_active?: string;
}

export function useStrains(query: StrainsQuery = {}) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['strains', query],
    queryFn: async () => {
      const res = await api.cultivation.strains.list({ query: { page: 1, limit: 50, ...query } });
      if (res.status !== 200) throw new Error('Failed to load strains');
      return res.body;
    },
  });
}

export function useStrain(id: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['strains', id],
    queryFn: async () => {
      const res = await api.cultivation.strains.getById({ params: { id } });
      if (res.status !== 200) throw new Error('Failed to load strain');
      return res.body;
    },
    enabled: !!id,
  });
}

export function useCreateStrain() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Parameters<typeof api.cultivation.strains.create>[0]['body']) => {
      const res = await api.cultivation.strains.create({ body });
      if (res.status !== 201) throw new Error('Failed to create strain');
      return res.body;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['strains'] }),
  });
}

export function useUpdateStrain() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: NonNullable<Parameters<typeof api.cultivation.strains.update>[0]['body']>;
    }) => {
      const res = await api.cultivation.strains.update({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to update strain');
      return res.body;
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['strains', id] });
      qc.invalidateQueries({ queryKey: ['strains'] });
    },
  });
}

export function useDeactivateStrain() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: NonNullable<Parameters<typeof api.cultivation.strains.deactivate>[0]['body']>;
    }) => {
      const res = await api.cultivation.strains.deactivate({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to deactivate strain');
      return res.body;
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['strains', id] });
      qc.invalidateQueries({ queryKey: ['strains'] });
    },
  });
}

// ─── QUALITY — CHANGE CONTROLS ───────────────────────────────────────────────

interface ChangeControlsQuery {
  page?: number;
  limit?: number;
  status?: string;
  change_type?: string;
}

export function useChangeControls(query: ChangeControlsQuery = {}) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['changeControls', query],
    queryFn: async () => {
      const res = await api.quality.listChangeControls({
        query: { page: 1, limit: 20, ...query } as unknown as Record<string, unknown>,
      } as Parameters<typeof api.quality.listChangeControls>[0]);
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

export function useCreateChangeControl() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Parameters<typeof api.quality.createChangeControl>[0]['body']) => {
      const res = await api.quality.createChangeControl({ body });
      if (res.status !== 201) throw new Error('Failed to create change control');
      return res.body;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['changeControls'] });
    },
  });
}

export function useSubmitChangeControl() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body?: Parameters<typeof api.quality.submitChangeControl>[0]['body'];
    }) => {
      const res = await api.quality.submitChangeControl({
        params: { id },
        body: body ?? {},
      } as Parameters<typeof api.quality.submitChangeControl>[0]);
      if (res.status !== 200) throw new Error('Failed to submit change control');
      return res.body;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['changeControls', id] });
      qc.invalidateQueries({ queryKey: ['changeControls'] });
    },
  });
}

export function useAssessImpact() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof api.quality.assessImpact>[0]['body'];
    }) => {
      const res = await api.quality.assessImpact({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to assess impact');
      return res.body;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['changeControls', id] });
      qc.invalidateQueries({ queryKey: ['changeControls'] });
    },
  });
}

export function useApproveChangeControl() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof api.quality.approveChangeControl>[0]['body'];
    }) => {
      const res = await api.quality.approveChangeControl({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to approve change control');
      return res.body;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['changeControls', id] });
      qc.invalidateQueries({ queryKey: ['changeControls'] });
    },
  });
}

export function useRejectChangeControl() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof api.quality.rejectChangeControl>[0]['body'];
    }) => {
      const res = await api.quality.rejectChangeControl({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to reject change control');
      return res.body;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['changeControls', id] });
      qc.invalidateQueries({ queryKey: ['changeControls'] });
    },
  });
}

export function useVerifyChangeControl() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof api.quality.verifyChangeControl>[0]['body'];
    }) => {
      const res = await api.quality.verifyChangeControl({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to verify change control');
      return res.body;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['changeControls', id] });
      qc.invalidateQueries({ queryKey: ['changeControls'] });
    },
  });
}

export function useCloseChangeControl() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof api.quality.closeChangeControl>[0]['body'];
    }) => {
      const res = await api.quality.closeChangeControl({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to close change control');
      return res.body;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['changeControls', id] });
      qc.invalidateQueries({ queryKey: ['changeControls'] });
    },
  });
}

// ─── QUALITY — CAPAs ─────────────────────────────────────────────────────────

interface CAPAsQuery {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  source?: string;
  overdue?: boolean;
}

export function useCAPAs(query: CAPAsQuery = {}) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['capas', query],
    queryFn: async () => {
      const res = await api.quality.listCapas({
        query: { page: 1, limit: 20, ...query } as unknown as Record<string, unknown>,
      } as Parameters<typeof api.quality.listCapas>[0]);
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

export function useCreateCAPA() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Parameters<typeof api.quality.createCapa>[0]['body']) => {
      const res = await api.quality.createCapa({ body });
      if (res.status !== 201) throw new Error('Failed to create CAPA');
      return res.body;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['capas'] });
    },
  });
}

export function useInitiateRca() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof api.quality.initiateRca>[0]['body'];
    }) => {
      const res = await api.quality.initiateRca({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to initiate RCA');
      return res.body;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['capas', id] });
      qc.invalidateQueries({ queryKey: ['capas'] });
    },
  });
}

export function useCreateActionPlan() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof api.quality.createActionPlan>[0]['body'];
    }) => {
      const res = await api.quality.createActionPlan({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to create action plan');
      return res.body;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['capas', id] });
      qc.invalidateQueries({ queryKey: ['capas'] });
    },
  });
}

export function useCheckEffectiveness() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof api.quality.checkEffectiveness>[0]['body'];
    }) => {
      const res = await api.quality.checkEffectiveness({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to record effectiveness check');
      return res.body;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['capas', id] });
      qc.invalidateQueries({ queryKey: ['capas'] });
    },
  });
}

export function useCloseCAPA() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof api.quality.closeCapa>[0]['body'];
    }) => {
      const res = await api.quality.closeCapa({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to close CAPA');
      return res.body;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['capas', id] });
      qc.invalidateQueries({ queryKey: ['capas'] });
    },
  });
}

// ─── QUALITY — DEVIATIONS ────────────────────────────────────────────────────

interface DeviationsQuery {
  page?: number;
  limit?: number;
  status?: string;
  classification?: string;
  category?: string;
}

export function useDeviations(query: DeviationsQuery = {}) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['deviations', query],
    queryFn: async () => {
      const res = await api.quality.listDeviations({
        query: { page: 1, limit: 20, ...query } as unknown as Record<string, unknown>,
      } as Parameters<typeof api.quality.listDeviations>[0]);
      if (res.status !== 200) throw new Error('Failed to load deviations');
      return res.body;
    },
  });
}

export function useDeviation(id: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['deviations', id],
    queryFn: async () => {
      const res = await api.quality.getDeviation({ params: { id } });
      if (res.status !== 200) throw new Error('Failed to load deviation');
      return res.body;
    },
    enabled: !!id,
  });
}

export function useReportDeviation() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Parameters<typeof api.quality.reportDeviation>[0]['body']) => {
      const res = await api.quality.reportDeviation({ body });
      if (res.status !== 201) throw new Error('Failed to report deviation');
      return res.body;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deviations'] });
    },
  });
}

export function useInvestigateDeviation() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof api.quality.investigateDeviation>[0]['body'];
    }) => {
      const res = await api.quality.investigateDeviation({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to investigate deviation');
      return res.body;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['deviations', id] });
      qc.invalidateQueries({ queryKey: ['deviations'] });
    },
  });
}

export function useAssessDeviationImpact() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof api.quality.assessDeviationImpact>[0]['body'];
    }) => {
      const res = await api.quality.assessDeviationImpact({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to assess deviation impact');
      return res.body;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['deviations', id] });
      qc.invalidateQueries({ queryKey: ['deviations'] });
    },
  });
}

export function useLinkCapaToDeviation() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof api.quality.linkCapaToDeviation>[0]['body'];
    }) => {
      const res = await api.quality.linkCapaToDeviation({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to link CAPA');
      return res.body;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['deviations', id] });
      qc.invalidateQueries({ queryKey: ['deviations'] });
    },
  });
}

export function useCloseDeviation() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof api.quality.closeDeviation>[0]['body'];
    }) => {
      const res = await api.quality.closeDeviation({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to close deviation');
      return res.body;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['deviations', id] });
      qc.invalidateQueries({ queryKey: ['deviations'] });
    },
  });
}

// ─── QUALITY — VALIDATION PROTOCOLS ──────────────────────────────────────────

interface ValidationProtocolsQuery {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
}

export function useValidationProtocols(query: ValidationProtocolsQuery = {}) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['validationProtocols', query],
    queryFn: async () => {
      const res = await api.quality.listValidationProtocols({
        query: { page: 1, limit: 20, ...query } as unknown as Record<string, unknown>,
      } as Parameters<typeof api.quality.listValidationProtocols>[0]);
      if (res.status !== 200) throw new Error('Failed to load validation protocols');
      return res.body;
    },
  });
}

export function useValidationProtocol(id: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['validationProtocols', id],
    queryFn: async () => {
      const res = await api.quality.getValidationProtocol({ params: { id } });
      if (res.status !== 200) throw new Error('Failed to load validation protocol');
      return res.body;
    },
    enabled: !!id,
  });
}

export function useValidationProtocolSummary(id: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['validationProtocols', id, 'summary'],
    queryFn: async () => {
      const res = await api.quality.getValidationProtocolSummary({ params: { id } });
      if (res.status !== 200) throw new Error('Failed to load protocol summary');
      return res.body;
    },
    enabled: !!id,
  });
}

export function useCreateValidationProtocol() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: Parameters<typeof api.quality.createValidationProtocol>[0]['body'],
    ) => {
      const res = await api.quality.createValidationProtocol({ body });
      if (res.status !== 201) throw new Error('Failed to create validation protocol');
      return res.body;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['validationProtocols'] });
    },
  });
}

export function useApproveValidationProtocol() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof api.quality.approveValidationProtocol>[0]['body'];
    }) => {
      const res = await api.quality.approveValidationProtocol({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to approve validation protocol');
      return res.body;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['validationProtocols', id] });
      qc.invalidateQueries({ queryKey: ['validationProtocols'] });
    },
  });
}

export function useExecuteValidationTest() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof api.quality.executeValidationTest>[0]['body'];
    }) => {
      const res = await api.quality.executeValidationTest({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to execute validation test');
      return res.body;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['validationProtocols', id] });
      qc.invalidateQueries({ queryKey: ['validationProtocols', id, 'summary'] });
    },
  });
}

export function useCloseValidationProtocol() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof api.quality.closeValidationProtocol>[0]['body'];
    }) => {
      const res = await api.quality.closeValidationProtocol({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to close validation protocol');
      return res.body;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['validationProtocols', id] });
      qc.invalidateQueries({ queryKey: ['validationProtocols'] });
    },
  });
}

// ─── QUALITY — QUALITY EVENTS ────────────────────────────────────────────────

interface QualityEventsQuery {
  page?: number;
  limit?: number;
  status?: string;
  severity?: string;
  type?: string;
}

export function useQualityEvents(query: QualityEventsQuery = {}) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['qualityEvents', query],
    queryFn: async () => {
      const res = await api.quality.listQualityEvents({
        query: { page: 1, limit: 20, ...query } as unknown as Record<string, unknown>,
      } as Parameters<typeof api.quality.listQualityEvents>[0]);
      if (res.status !== 200) throw new Error('Failed to load quality events');
      return res.body;
    },
  });
}

export function useQualityEvent(id: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['qualityEvents', id],
    queryFn: async () => {
      const res = await api.quality.getQualityEvent({ params: { id } });
      if (res.status !== 200) throw new Error('Failed to load quality event');
      return res.body;
    },
    enabled: !!id,
  });
}

export function useCreateQualityEvent() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Parameters<typeof api.quality.createQualityEvent>[0]['body']) => {
      const res = await api.quality.createQualityEvent({ body });
      if (res.status !== 201) throw new Error('Failed to create quality event');
      return res.body;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['qualityEvents'] });
    },
  });
}

export function useInvestigateQualityEvent() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof api.quality.investigateQualityEvent>[0]['body'];
    }) => {
      const res = await api.quality.investigateQualityEvent({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to investigate quality event');
      return res.body;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['qualityEvents', id] });
      qc.invalidateQueries({ queryKey: ['qualityEvents'] });
    },
  });
}

export function useLinkRecordToQualityEvent() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof api.quality.linkRecordToQualityEvent>[0]['body'];
    }) => {
      const res = await api.quality.linkRecordToQualityEvent({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to link record');
      return res.body;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['qualityEvents', id] });
    },
  });
}

export function useCloseQualityEvent() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof api.quality.closeQualityEvent>[0]['body'];
    }) => {
      const res = await api.quality.closeQualityEvent({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to close quality event');
      return res.body;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['qualityEvents', id] });
      qc.invalidateQueries({ queryKey: ['qualityEvents'] });
    },
  });
}

// ─── FINANCIAL ────────────────────────────────────────────────────────────────

interface AccountsQuery {
  page?: number;
  limit?: number;
  account_type?: string;
  is_active?: string;
}

export function useAccounts(query: AccountsQuery = {}) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['accounts', query],
    queryFn: async () => {
      const res = await api.financial.listAccounts({
        query: { page: 1, limit: 100, ...query } as unknown as Record<string, unknown>,
      } as Parameters<typeof api.financial.listAccounts>[0]);
      if (res.status !== 200) throw new Error('Failed to load accounts');
      return res.body;
    },
  });
}

export function useAccount(id: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['accounts', id],
    queryFn: async () => {
      const res = await api.financial.getAccount({ params: { id } });
      if (res.status !== 200) throw new Error('Failed to load account');
      return res.body;
    },
    enabled: !!id,
  });
}

export function useCreateAccount() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Parameters<typeof api.financial.createAccount>[0]['body']) => {
      const res = await api.financial.createAccount({ body });
      if (res.status !== 201) throw new Error('Failed to create account');
      return res.body;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

interface JournalEntriesQuery {
  page?: number;
  limit?: number;
  status?: string;
}

export function useJournalEntries(query: JournalEntriesQuery = {}) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['journalEntries', query],
    queryFn: async () => {
      const res = await api.financial.listJournalEntries({
        query: { page: 1, limit: 20, ...query } as unknown as Record<string, unknown>,
      } as Parameters<typeof api.financial.listJournalEntries>[0]);
      if (res.status !== 200) throw new Error('Failed to load journal entries');
      return res.body;
    },
  });
}

export function useJournalEntry(id: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['journalEntries', id],
    queryFn: async () => {
      const res = await api.financial.getJournalEntry({ params: { id } });
      if (res.status !== 200) throw new Error('Failed to load journal entry');
      return res.body;
    },
    enabled: !!id,
  });
}

export function useCreateJournalEntry() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Parameters<typeof api.financial.createJournalEntry>[0]['body']) => {
      const res = await api.financial.createJournalEntry({ body });
      if (res.status !== 201) throw new Error('Failed to create journal entry');
      return res.body;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journalEntries'] });
    },
  });
}

export function usePostJournalEntry() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof api.financial.postJournalEntry>[0]['body'];
    }) => {
      const res = await api.financial.postJournalEntry({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to post journal entry');
      return res.body;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['journalEntries', id] });
      qc.invalidateQueries({ queryKey: ['journalEntries'] });
    },
  });
}

export function useReverseJournalEntry() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof api.financial.reverseJournalEntry>[0]['body'];
    }) => {
      const res = await api.financial.reverseJournalEntry({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to reverse journal entry');
      return res.body;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['journalEntries', id] });
      qc.invalidateQueries({ queryKey: ['journalEntries'] });
    },
  });
}

export function useLatestBiologicalAssetValuation(batchId: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['biologicalAssets', batchId],
    queryFn: async () => {
      const res = await api.financial.getLatestBiologicalAssetValuation({ params: { batchId } });
      if (res.status !== 200) throw new Error('Failed to load valuation');
      return res.body;
    },
    enabled: !!batchId,
  });
}

export function useRecordBiologicalAssetValuation() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: Parameters<typeof api.financial.recordBiologicalAssetValuation>[0]['body'],
    ) => {
      const res = await api.financial.recordBiologicalAssetValuation({ body });
      if (res.status !== 201) throw new Error('Failed to record valuation');
      return res.body;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['biologicalAssets'] });
    },
  });
}

// ─── PROCUREMENT ──────────────────────────────────────────────────────────────

interface SuppliersQuery {
  page?: number;
  limit?: number;
  qualification_status?: string;
  is_active?: string;
}

export function useSuppliers(query: SuppliersQuery = {}) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['suppliers', query],
    queryFn: async () => {
      const res = await api.procurement.listSuppliers({
        query: { page: 1, limit: 20, ...query } as unknown as Record<string, unknown>,
      } as Parameters<typeof api.procurement.listSuppliers>[0]);
      if (res.status !== 200) throw new Error('Failed to load suppliers');
      return res.body;
    },
  });
}

export function useSupplier(id: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['suppliers', id],
    queryFn: async () => {
      const res = await api.procurement.getSupplier({ params: { id } });
      if (res.status !== 200) throw new Error('Failed to load supplier');
      return res.body;
    },
    enabled: !!id,
  });
}

export function useCreateSupplier() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Parameters<typeof api.procurement.createSupplier>[0]['body']) => {
      const res = await api.procurement.createSupplier({ body });
      if (res.status !== 201) throw new Error('Failed to create supplier');
      return res.body;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

export function useQualifySupplier() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof api.procurement.qualifySupplier>[0]['body'];
    }) => {
      const res = await api.procurement.qualifySupplier({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to qualify supplier');
      return res.body;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['suppliers', id] });
      qc.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

interface PurchaseOrdersQuery {
  page?: number;
  limit?: number;
  status?: string;
  supplier_id?: string;
}

export function usePurchaseOrders(query: PurchaseOrdersQuery = {}) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['purchaseOrders', query],
    queryFn: async () => {
      const res = await api.procurement.listPurchaseOrders({
        query: { page: 1, limit: 20, ...query } as unknown as Record<string, unknown>,
      } as Parameters<typeof api.procurement.listPurchaseOrders>[0]);
      if (res.status !== 200) throw new Error('Failed to load purchase orders');
      return res.body;
    },
  });
}

export function usePurchaseOrder(id: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['purchaseOrders', id],
    queryFn: async () => {
      const res = await api.procurement.getPurchaseOrder({ params: { id } });
      if (res.status !== 200) throw new Error('Failed to load purchase order');
      return res.body;
    },
    enabled: !!id,
  });
}

export function useCreatePurchaseOrder() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Parameters<typeof api.procurement.createPurchaseOrder>[0]['body']) => {
      const res = await api.procurement.createPurchaseOrder({ body });
      if (res.status !== 201) throw new Error('Failed to create purchase order');
      return res.body;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
  });
}

export function useSubmitPurchaseOrder() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof api.procurement.submitPurchaseOrder>[0]['body'];
    }) => {
      const res = await api.procurement.submitPurchaseOrder({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to submit purchase order');
      return res.body;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['purchaseOrders', id] });
      qc.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
  });
}

export function useAcknowledgePurchaseOrder() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof api.procurement.acknowledgePurchaseOrder>[0]['body'];
    }) => {
      const res = await api.procurement.acknowledgePurchaseOrder({
        params: { id },
        body,
      } as Parameters<typeof api.procurement.acknowledgePurchaseOrder>[0]);
      if (res.status !== 200) throw new Error('Failed to acknowledge purchase order');
      return res.body;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['purchaseOrders', id] });
      qc.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
  });
}

export function useReceiveGoods() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof api.procurement.receiveGoods>[0]['body'];
    }) => {
      const res = await api.procurement.receiveGoods({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to receive goods');
      return res.body;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['purchaseOrders', id] });
      qc.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
  });
}

export function useClosePurchaseOrder() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof api.procurement.closePurchaseOrder>[0]['body'];
    }) => {
      const res = await api.procurement.closePurchaseOrder({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to close purchase order');
      return res.body;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['purchaseOrders', id] });
      qc.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
  });
}

export function useCancelPurchaseOrder() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof api.procurement.cancelPurchaseOrder>[0]['body'];
    }) => {
      const res = await api.procurement.cancelPurchaseOrder({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to cancel purchase order');
      return res.body;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['purchaseOrders', id] });
      qc.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
  });
}

// ─── WORKFORCE ────────────────────────────────────────────────────────────────

interface EmployeesQuery {
  page?: number;
  limit?: number;
  department?: string;
  is_active?: string;
  role?: string;
}

export function useEmployees(query: EmployeesQuery = {}) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['employees', query],
    queryFn: async () => {
      const res = await api.workforce.listEmployees({
        query: { page: 1, limit: 20, ...query } as unknown as Record<string, unknown>,
      } as Parameters<typeof api.workforce.listEmployees>[0]);
      if (res.status !== 200) throw new Error('Failed to load employees');
      return res.body;
    },
  });
}

export function useEmployee(id: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['employees', id],
    queryFn: async () => {
      const res = await api.workforce.getEmployee({ params: { id } });
      if (res.status !== 200) throw new Error('Failed to load employee');
      return res.body;
    },
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Parameters<typeof api.workforce.createEmployee>[0]['body']) => {
      const res = await api.workforce.createEmployee({ body });
      if (res.status !== 201) throw new Error('Failed to create employee');
      return res.body;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useDeactivateEmployee() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: NonNullable<Parameters<typeof api.workforce.deactivateEmployee>[0]['body']>;
    }) => {
      const res = await api.workforce.deactivateEmployee({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to deactivate employee');
      return res.body;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['employees', id] });
      qc.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useEmployeeCompetency(employeeId: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['employees', employeeId, 'competency'],
    queryFn: async () => {
      const res = await api.workforce.getCompetencyProfile({ params: { id: employeeId } });
      if (res.status !== 200) throw new Error('Failed to load competency');
      return res.body;
    },
    enabled: !!employeeId,
  });
}

// Tasks

interface TasksQuery {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  assigned_to?: string;
  zone_id?: string;
  batch_id?: string;
  scheduled_date?: string;
}

export function useTasks(query: TasksQuery = {}) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['tasks', query],
    queryFn: async () => {
      const res = await api.workforce.listTasks({
        query: { page: 1, limit: 20, ...query } as unknown as Record<string, unknown>,
      } as Parameters<typeof api.workforce.listTasks>[0]);
      if (res.status !== 200) throw new Error('Failed to load tasks');
      return res.body;
    },
  });
}

export function useTask(id: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['tasks', id],
    queryFn: async () => {
      const res = await api.workforce.getTask({ params: { id } });
      if (res.status !== 200) throw new Error('Failed to load task');
      return res.body;
    },
    enabled: !!id,
  });
}

export function useCreateTask() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Parameters<typeof api.workforce.createTask>[0]['body']) => {
      const res = await api.workforce.createTask({ body });
      if (res.status !== 201) throw new Error('Failed to create task');
      return res.body;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useCompleteTask() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: NonNullable<Parameters<typeof api.workforce.completeTask>[0]['body']>;
    }) => {
      const res = await api.workforce.completeTask({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to complete task');
      return res.body;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['tasks', id] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useAssignTask() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof api.workforce.assignTask>[0]['body'];
    }) => {
      const res = await api.workforce.assignTask({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to assign task');
      return res.body;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['tasks', id] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

// Time Entries

interface TimeEntriesQuery {
  page?: number;
  limit?: number;
  employee_id?: string;
  task_id?: string;
  from_date?: string;
  to_date?: string;
}

export function useTimeEntries(query: TimeEntriesQuery = {}) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['timeEntries', query],
    queryFn: async () => {
      const res = await api.workforce.listTimeEntries({
        query: { page: 1, limit: 20, ...query } as unknown as Record<string, unknown>,
      } as Parameters<typeof api.workforce.listTimeEntries>[0]);
      if (res.status !== 200) throw new Error('Failed to load time entries');
      return res.body;
    },
  });
}

export function useCreateTimeEntry() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Parameters<typeof api.workforce.createTimeEntry>[0]['body']) => {
      const res = await api.workforce.createTimeEntry({ body });
      if (res.status !== 201) throw new Error('Failed to create time entry');
      return res.body;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timeEntries'] });
    },
  });
}

export function useClockOut() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: NonNullable<Parameters<typeof api.workforce.clockOut>[0]['body']>;
    }) => {
      const res = await api.workforce.clockOut({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to clock out');
      return res.body;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timeEntries'] });
    },
  });
}

export function useApproveTimeEntry() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: NonNullable<Parameters<typeof api.workforce.approveTimeEntry>[0]['body']>;
    }) => {
      const res = await api.workforce.approveTimeEntry({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to approve time entry');
      return res.body;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timeEntries'] });
    },
  });
}

// Training Courses

interface CoursesQuery {
  page?: number;
  limit?: number;
  training_type?: string;
  is_mandatory?: string;
}

export function useCourses(query: CoursesQuery = {}) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['courses', query],
    queryFn: async () => {
      const res = await api.workforce.listCourses({
        query: { page: 1, limit: 20, ...query } as unknown as Record<string, unknown>,
      } as Parameters<typeof api.workforce.listCourses>[0]);
      if (res.status !== 200) throw new Error('Failed to load courses');
      return res.body;
    },
  });
}

export function useCourse(id: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['courses', id],
    queryFn: async () => {
      const res = await api.workforce.getCourse({ params: { id } });
      if (res.status !== 200) throw new Error('Failed to load course');
      return res.body;
    },
    enabled: !!id,
  });
}

export function useCreateCourse() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Parameters<typeof api.workforce.createCourse>[0]['body']) => {
      const res = await api.workforce.createCourse({ body });
      if (res.status !== 201) throw new Error('Failed to create course');
      return res.body;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

// Training Executions

interface TrainingExecutionsQuery {
  page?: number;
  limit?: number;
  employee_id?: string;
  course_id?: string;
  status?: string;
}

export function useTrainingExecutions(query: TrainingExecutionsQuery = {}) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['trainingExecutions', query],
    queryFn: async () => {
      const res = await api.workforce.listTrainingExecutions({
        query: { page: 1, limit: 20, ...query } as unknown as Record<string, unknown>,
      } as Parameters<typeof api.workforce.listTrainingExecutions>[0]);
      if (res.status !== 200) throw new Error('Failed to load training executions');
      return res.body;
    },
  });
}

export function useCreateTrainingExecution() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Parameters<typeof api.workforce.scheduleTraining>[0]['body']) => {
      const res = await api.workforce.scheduleTraining({ body });
      if (res.status !== 201) throw new Error('Failed to schedule training');
      return res.body;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trainingExecutions'] });
    },
  });
}

export function useCompleteTrainingExecution() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: NonNullable<Parameters<typeof api.workforce.completeTraining>[0]['body']>;
    }) => {
      const res = await api.workforce.completeTraining({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to complete training');
      return res.body;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trainingExecutions'] });
      qc.invalidateQueries({ queryKey: ['certifications'] });
    },
  });
}

// Certifications

interface CertificationsQuery {
  page?: number;
  limit?: number;
  employee_id?: string;
  course_id?: string;
  is_active?: string;
}

export function useCertifications(query: CertificationsQuery = {}) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['certifications', query],
    queryFn: async () => {
      const res = await api.workforce.listCertifications({
        query: { page: 1, limit: 20, ...query } as unknown as Record<string, unknown>,
      } as Parameters<typeof api.workforce.listCertifications>[0]);
      if (res.status !== 200) throw new Error('Failed to load certifications');
      return res.body;
    },
  });
}

// ─── ANALYTICS (EXTENDED) ────────────────────────────────────────────────────

export function useTrainingCompliance(
  query: { period?: string; department?: string; is_mandatory?: string } = {},
) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['analytics', 'trainingCompliance', query],
    queryFn: async () => {
      const res = await api.analytics.getTrainingCompliance({
        query: query as unknown as Record<string, unknown>,
      } as Parameters<typeof api.analytics.getTrainingCompliance>[0]);
      if (res.status !== 200) throw new Error('Failed to load training compliance');
      return res.body;
    },
  });
}

export function useWorkforceSummary(query: { period?: string } = {}) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['analytics', 'workforceSummary', query],
    queryFn: async () => {
      const res = await api.analytics.getWorkforceSummary({ query });
      if (res.status !== 200) throw new Error('Failed to load workforce summary');
      return res.body;
    },
  });
}

// ─── SPATIAL ──────────────────────────────────────────────────────────────────

interface ZonesQuery {
  page?: number;
  limit?: number;
  zone_type?: string;
  is_active?: string;
}

export function useZones(query: ZonesQuery = {}) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['zones', query],
    queryFn: async () => {
      const res = await api.spatial.listZones({
        query: { page: 1, limit: 20, ...query } as unknown as Record<string, unknown>,
      } as Parameters<typeof api.spatial.listZones>[0]);
      if (res.status !== 200) throw new Error('Failed to load zones');
      return res.body;
    },
  });
}

export function useZone(id: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['zones', id],
    queryFn: async () => {
      const res = await api.spatial.getZone({ params: { id } });
      if (res.status !== 200) throw new Error('Failed to load zone');
      return res.body;
    },
    enabled: !!id,
  });
}

export function useCreateZone() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Parameters<typeof api.spatial.createZone>[0]['body']) => {
      const res = await api.spatial.createZone({ body });
      if (res.status !== 201) throw new Error('Failed to create zone');
      return res.body;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['zones'] });
    },
  });
}

export function useActiveAssignments(zoneId: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['zones', zoneId, 'assignments'],
    queryFn: async () => {
      const res = await api.spatial.listActiveAssignments({
        params: { zoneId },
        query: { page: 1, limit: 100 },
      });
      if (res.status !== 200) throw new Error('Failed to load assignments');
      return res.body;
    },
    enabled: !!zoneId,
  });
}

export function useAssignBatchToZone() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Parameters<typeof api.spatial.assignBatchToZone>[0]['body']) => {
      const res = await api.spatial.assignBatchToZone({ body });
      if (res.status !== 201) throw new Error('Failed to assign batch');
      return res.body;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['zones'] });
    },
  });
}

export function useBatchAssignment(id: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['zones', 'assignments', id],
    queryFn: async () => {
      const res = await api.spatial.getBatchAssignment({ params: { id } });
      if (res.status !== 200) throw new Error('Failed to load assignment');
      return res.body;
    },
    enabled: !!id,
  });
}

export function useReleaseBatchFromZone() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof api.spatial.releaseBatchFromZone>[0]['body'];
    }) => {
      const res = await api.spatial.releaseBatchFromZone({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to release batch');
      return res.body;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['zones'] });
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

export function useAuditReadiness() {
  const api = useApiClient();
  return useQuery({
    queryKey: ['analytics', 'auditReadiness'],
    queryFn: async () => {
      const res = await api.analytics.getAuditReadiness({ query: {} });
      if (res.status !== 200) throw new Error('Failed to load audit readiness');
      return res.body;
    },
  });
}

export function useAuditTrail(
  query: {
    entity_type?: string;
    from?: string;
    to?: string;
    user_id?: string;
    page?: number;
    limit?: number;
  } = {},
) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['audit', 'trail', query],
    queryFn: async () => {
      const res = await api.audit.query({
        query: { page: 1, limit: 20, ...query } as unknown as Record<string, unknown>,
      } as Parameters<typeof api.audit.query>[0]);
      if (res.status !== 200) throw new Error('Failed to load audit trail');
      return res.body;
    },
  });
}

// ─── IOT ──────────────────────────────────────────────────────────────────────

export function useZoneReadings(zoneId: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['iot', 'readings', zoneId],
    queryFn: async () => {
      const res = await api.iot.getZoneReadings({ params: { zoneId } });
      if (res.status !== 200) throw new Error('Failed to load zone readings');
      return res.body;
    },
    enabled: !!zoneId,
    refetchInterval: 30_000,
  });
}

export function useIotAlerts(query: { zone_id?: string; acknowledged?: string } = {}) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['iot', 'alerts', query],
    queryFn: async () => {
      const res = await api.iot.listAlerts({
        query: { page: 1, limit: 50, ...query } as unknown as Record<string, unknown>,
      } as Parameters<typeof api.iot.listAlerts>[0]);
      if (res.status !== 200) throw new Error('Failed to load IoT alerts');
      return res.body;
    },
    refetchInterval: 15_000,
  });
}

// ─── DOCUMENTS ────────────────────────────────────────────────────────────────

export function useDocuments(
  query: {
    status?: string;
    document_type?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {},
) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['documents', query],
    queryFn: async () => {
      const res = await api.documents.listDocuments({
        query: { page: 1, limit: 20, ...query } as unknown as Record<string, unknown>,
      } as Parameters<typeof api.documents.listDocuments>[0]);
      if (res.status !== 200) throw new Error('Failed to load documents');
      return res.body;
    },
  });
}

export function useDocument(id: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['documents', id],
    queryFn: async () => {
      const res = await api.documents.getDocument({ params: { id } });
      if (res.status !== 200) throw new Error('Failed to load document');
      return res.body;
    },
    enabled: !!id,
  });
}

export function useDocumentVersions(documentId: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['documents', documentId, 'versions'],
    queryFn: async () => {
      const res = await api.documents.listVersions({ params: { id: documentId } });
      if (res.status !== 200) throw new Error('Failed to load document versions');
      return res.body;
    },
    enabled: !!documentId,
  });
}

export function useCreateDocument() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: NonNullable<Parameters<typeof api.documents.createDocument>[0]['body']>,
    ) => {
      const res = await api.documents.createDocument({ body });
      if (res.status !== 201) throw new Error('Failed to create document');
      return res.body;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });
}

export function useUploadVersion(documentId: string) {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: NonNullable<Parameters<typeof api.documents.uploadVersion>[0]['body']>,
    ) => {
      const res = await api.documents.uploadVersion({ params: { id: documentId }, body });
      if (res.status !== 201) throw new Error('Failed to upload version');
      return res.body;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents', documentId] });
      qc.invalidateQueries({ queryKey: ['documents', documentId, 'versions'] });
    },
  });
}

export function useSubmitForReview() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: NonNullable<Parameters<typeof api.documents.submitForReview>[0]['body']>;
    }) => {
      const res = await api.documents.submitForReview({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to submit for review');
      return res.body;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });
}

export function useApproveDocument() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: { password: string; reason: string };
    }) => {
      const res = await api.documents.approveDocument({
        params: { id },
        body: body as unknown as Parameters<typeof api.documents.approveDocument>[0]['body'],
      });
      if (res.status !== 200) throw new Error('Failed to approve document');
      return res.body;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });
}

// ─── FACILITIES (Cultivation Spatial Hierarchy) ──────────────────────────────

interface FacilitiesQuery {
  page?: number;
  limit?: number;
  is_active?: string;
}

export function useFacilities(query: FacilitiesQuery = {}) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['facilities', query],
    queryFn: async () => {
      const res = await api.facility.facilities.list({
        query: { page: 1, limit: 20, ...query },
      });
      if (res.status !== 200) throw new Error('Failed to load facilities');
      return res.body;
    },
  });
}

export function useFacility(id: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['facilities', id],
    queryFn: async () => {
      const res = await api.facility.facilities.getById({ params: { id } });
      if (res.status !== 200) throw new Error('Failed to load facility');
      return res.body;
    },
    enabled: !!id,
  });
}

export function useCreateFacility() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Parameters<typeof api.facility.facilities.create>[0]['body']) => {
      const res = await api.facility.facilities.create({ body });
      if (res.status !== 201) throw new Error('Failed to create facility');
      return res.body;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['facilities'] }),
  });
}

export function useUpdateFacility() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: NonNullable<Parameters<typeof api.facility.facilities.update>[0]['body']>;
    }) => {
      const res = await api.facility.facilities.update({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to update facility');
      return res.body;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['facilities', id] });
      qc.invalidateQueries({ queryKey: ['facilities'] });
    },
  });
}

// ─── BUILDINGS ───────────────────────────────────────────────────────────────

interface BuildingsQuery {
  page?: number;
  limit?: number;
  building_type?: string;
}

export function useBuildings(facilityId: string, query: BuildingsQuery = {}) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['facilities', facilityId, 'buildings', query],
    queryFn: async () => {
      const res = await api.facility.facilities.listBuildings({
        params: { facilityId },
        query: { page: 1, limit: 20, ...query } as unknown as Record<string, unknown>,
      } as Parameters<typeof api.facility.facilities.listBuildings>[0]);
      if (res.status !== 200) throw new Error('Failed to load buildings');
      return res.body;
    },
    enabled: !!facilityId,
  });
}

export function useBuilding(id: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['buildings', id],
    queryFn: async () => {
      const res = await api.facility.buildings.getById({ params: { id } });
      if (res.status !== 200) throw new Error('Failed to load building');
      return res.body;
    },
    enabled: !!id,
  });
}

export function useCreateBuilding() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      facilityId,
      body,
    }: {
      facilityId: string;
      body: Parameters<typeof api.facility.facilities.createBuilding>[0]['body'];
    }) => {
      const res = await api.facility.facilities.createBuilding({
        params: { facilityId },
        body,
      });
      if (res.status !== 201) throw new Error('Failed to create building');
      return res.body;
    },
    onSuccess: (_d, { facilityId }) => {
      qc.invalidateQueries({ queryKey: ['facilities', facilityId, 'buildings'] });
    },
  });
}

export function useUpdateBuilding() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: NonNullable<Parameters<typeof api.facility.buildings.update>[0]['body']>;
    }) => {
      const res = await api.facility.buildings.update({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to update building');
      return res.body;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['buildings', id] });
      qc.invalidateQueries({ queryKey: ['facilities'] });
    },
  });
}

// ─── ROOMS (under buildings) ─────────────────────────────────────────────────

export function useBuildingRooms(
  buildingId: string,
  query: { page?: number; limit?: number } = {},
) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['buildings', buildingId, 'rooms', query],
    queryFn: async () => {
      const res = await api.facility.buildings.listRooms({
        params: { buildingId },
        query: { page: 1, limit: 20, ...query },
      });
      if (res.status !== 200) throw new Error('Failed to load rooms');
      return res.body;
    },
    enabled: !!buildingId,
  });
}

export function useCreateRoom() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      buildingId,
      body,
    }: {
      buildingId: string;
      body: Parameters<typeof api.facility.buildings.createRoom>[0]['body'];
    }) => {
      const res = await api.facility.buildings.createRoom({
        params: { buildingId },
        body,
      });
      if (res.status !== 201) throw new Error('Failed to create room');
      return res.body;
    },
    onSuccess: (_d, { buildingId }) => {
      qc.invalidateQueries({ queryKey: ['buildings', buildingId, 'rooms'] });
    },
  });
}

export function useRoom(id: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['rooms', id],
    queryFn: async () => {
      const res = await api.facility.rooms.getById({ params: { id } });
      if (res.status !== 200) throw new Error('Failed to load room');
      return res.body;
    },
    enabled: !!id,
  });
}

export function useUpdateRoom() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: NonNullable<Parameters<typeof api.facility.rooms.update>[0]['body']>;
    }) => {
      const res = await api.facility.rooms.update({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to update room');
      return res.body;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['rooms', id] });
      qc.invalidateQueries({ queryKey: ['buildings'] });
    },
  });
}

// ─── ZONES (under rooms) ────────────────────────────────────────────────────

interface RoomZonesQuery {
  page?: number;
  limit?: number;
  zone_type?: string;
}

export function useRoomZones(roomId: string, query: RoomZonesQuery = {}) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['rooms', roomId, 'zones', query],
    queryFn: async () => {
      const res = await api.facility.rooms.listZones({
        params: { roomId },
        query: { page: 1, limit: 20, ...query } as unknown as Record<string, unknown>,
      } as Parameters<typeof api.facility.rooms.listZones>[0]);
      if (res.status !== 200) throw new Error('Failed to load zones');
      return res.body;
    },
    enabled: !!roomId,
  });
}

export function useCreateCultivationZone() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      roomId,
      body,
    }: {
      roomId: string;
      body: Parameters<typeof api.facility.rooms.createZone>[0]['body'];
    }) => {
      const res = await api.facility.rooms.createZone({
        params: { roomId },
        body,
      });
      if (res.status !== 201) throw new Error('Failed to create zone');
      return res.body;
    },
    onSuccess: (_d, { roomId }) => {
      qc.invalidateQueries({ queryKey: ['rooms', roomId, 'zones'] });
    },
  });
}

export function useCultivationZone(id: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['cultivationZones', id],
    queryFn: async () => {
      const res = await api.facility.zones.getById({ params: { id } });
      if (res.status !== 200) throw new Error('Failed to load zone');
      return res.body;
    },
    enabled: !!id,
  });
}

export function useUpdateCultivationZone() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: NonNullable<Parameters<typeof api.facility.zones.update>[0]['body']>;
    }) => {
      const res = await api.facility.zones.update({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to update zone');
      return res.body;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['cultivationZones', id] });
      qc.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}

// ─── INCOMING INSPECTIONS ─────────────────────────────────────────────────────

interface IncomingInspectionsQuery {
  page?: number;
  limit?: number;
  status?: 'PENDING' | 'IN_PROGRESS' | 'QUARANTINE' | 'RELEASED' | 'REJECTED';
  supplier_id?: string;
  strain_id?: string;
}

export function useIncomingInspections(query: IncomingInspectionsQuery = {}) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['incomingInspections', query],
    queryFn: async () => {
      const res = await api.quality.listIncomingInspections({
        query: { page: 1, limit: 20, ...query },
      });
      if (res.status !== 200) throw new Error('Failed to load incoming inspections');
      return res.body;
    },
  });
}

export function useIncomingInspection(id: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['incomingInspections', id],
    queryFn: async () => {
      const res = await api.quality.getIncomingInspection({ params: { id } });
      if (res.status !== 200) throw new Error('Failed to load incoming inspection');
      return res.body;
    },
    enabled: !!id,
  });
}

export function usePerformInspection() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: NonNullable<Parameters<typeof api.quality.performInspection>[0]['body']>;
    }) => {
      const res = await api.quality.performInspection({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to perform inspection');
      return res.body;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['incomingInspections', id] });
      qc.invalidateQueries({ queryKey: ['incomingInspections'] });
    },
  });
}

export function useRecordTestResults() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: NonNullable<Parameters<typeof api.quality.recordTestResults>[0]['body']>;
    }) => {
      const res = await api.quality.recordTestResults({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to record test results');
      return res.body;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['incomingInspections', id] });
      qc.invalidateQueries({ queryKey: ['incomingInspections'] });
    },
  });
}

export function useReleaseInspection() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: NonNullable<Parameters<typeof api.quality.releaseInspection>[0]['body']>;
    }) => {
      const res = await api.quality.releaseInspection({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to release inspection');
      return res.body;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['incomingInspections', id] });
      qc.invalidateQueries({ queryKey: ['incomingInspections'] });
    },
  });
}

export function useRejectInspection() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: NonNullable<Parameters<typeof api.quality.rejectInspection>[0]['body']>;
    }) => {
      const res = await api.quality.rejectInspection({ params: { id }, body });
      if (res.status !== 200) throw new Error('Failed to reject inspection');
      return res.body;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['incomingInspections', id] });
      qc.invalidateQueries({ queryKey: ['incomingInspections'] });
    },
  });
}
