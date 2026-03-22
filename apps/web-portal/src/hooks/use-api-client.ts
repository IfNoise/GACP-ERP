'use client';

import { initClient } from '@ts-rest/core';
import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import {
  cultivationContract,
  qualityContract,
  financialContract,
  procurementContract,
  workforceContract,
  spatialContract,
  analyticsContract,
  iotContract,
  auditContract,
} from '@gacp-erp/shared-contracts';

function createClient<T extends Parameters<typeof initClient>[0]>(
  contract: T,
  baseUrl: string,
  accessToken?: string,
) {
  return initClient(contract, {
    baseUrl,
    baseHeaders: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
}

const API_BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api';

export function useApiClient() {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return useMemo(
    () => ({
      cultivation: createClient(cultivationContract, API_BASE_URL, token),
      quality: createClient(qualityContract, API_BASE_URL, token),
      financial: createClient(financialContract, API_BASE_URL, token),
      procurement: createClient(procurementContract, API_BASE_URL, token),
      workforce: createClient(workforceContract, API_BASE_URL, token),
      spatial: createClient(spatialContract, API_BASE_URL, token),
      analytics: createClient(analyticsContract, API_BASE_URL, token),
      iot: createClient(iotContract, API_BASE_URL, token),
      audit: createClient(auditContract, API_BASE_URL, token),
    }),
    [token],
  );
}
