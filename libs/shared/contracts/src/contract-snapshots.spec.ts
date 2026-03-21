import {
  authContract,
  cultivationContract,
  auditContract,
  iotContract,
  qualityContract,
  financialContract,
  procurementContract,
  spatialContract,
  workforceContract,
  analyticsContract,
} from './index';

/**
 * Extract stable contract shape (method + path) for snapshot comparison.
 * This catches accidental endpoint renames / removals.
 */
function extractContractShape(
  contract: Record<string, unknown>,
): Record<string, { method: string; path: string }> {
  const shape: Record<string, { method: string; path: string }> = {};
  for (const [key, value] of Object.entries(contract)) {
    const v = value as Record<string, unknown>;
    if (typeof v.method === 'string' && typeof v.path === 'string') {
      shape[key] = { method: v.method, path: v.path };
    }
  }
  return shape;
}

describe('Contract snapshot tests', () => {
  it('authContract shape matches snapshot', () => {
    expect(extractContractShape(authContract)).toMatchSnapshot();
  });

  it('cultivationContract shape matches snapshot', () => {
    expect(extractContractShape(cultivationContract)).toMatchSnapshot();
  });

  it('auditContract shape matches snapshot', () => {
    expect(extractContractShape(auditContract)).toMatchSnapshot();
  });

  it('iotContract shape matches snapshot', () => {
    expect(extractContractShape(iotContract)).toMatchSnapshot();
  });

  it('qualityContract shape matches snapshot', () => {
    expect(extractContractShape(qualityContract)).toMatchSnapshot();
  });

  it('financialContract shape matches snapshot', () => {
    expect(extractContractShape(financialContract)).toMatchSnapshot();
  });

  it('procurementContract shape matches snapshot', () => {
    expect(extractContractShape(procurementContract)).toMatchSnapshot();
  });

  it('spatialContract shape matches snapshot', () => {
    expect(extractContractShape(spatialContract)).toMatchSnapshot();
  });

  it('workforceContract shape matches snapshot', () => {
    expect(extractContractShape(workforceContract)).toMatchSnapshot();
  });

  it('analyticsContract shape matches snapshot', () => {
    expect(extractContractShape(analyticsContract)).toMatchSnapshot();
  });
});
