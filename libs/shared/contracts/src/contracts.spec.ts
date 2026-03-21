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

describe('Contracts barrel export', () => {
  it('all contracts are defined', () => {
    expect(authContract).toBeDefined();
    expect(cultivationContract).toBeDefined();
    expect(auditContract).toBeDefined();
    expect(iotContract).toBeDefined();
    expect(qualityContract).toBeDefined();
    expect(financialContract).toBeDefined();
    expect(procurementContract).toBeDefined();
    expect(spatialContract).toBeDefined();
    expect(workforceContract).toBeDefined();
    expect(analyticsContract).toBeDefined();
  });
});

/* Exercise .transform() callbacks in query schemas to cover inner functions */
describe('Contract query schema transforms', () => {
  it('workforce listEmployees is_active transform', () => {
    const result = workforceContract.listEmployees.query.parse({ is_active: 'true' });
    expect(result.is_active).toBe(true);
  });

  it('workforce listCourses is_mandatory transform', () => {
    const result = workforceContract.listCourses.query.parse({ is_mandatory: 'true' });
    expect(result.is_mandatory).toBe(true);
  });

  it('workforce listCertifications is_active transform', () => {
    const result = workforceContract.listCertifications.query.parse({ is_active: 'true' });
    expect(result.is_active).toBe(true);
  });

  it('analytics getTrainingCompliance is_mandatory transform', () => {
    const result = analyticsContract.getTrainingCompliance.query.parse({ is_mandatory: 'true' });
    expect(result.is_mandatory).toBe(true);
  });

  it('financial listAccounts is_active transform', () => {
    const result = financialContract.listAccounts.query.parse({ is_active: 'true' });
    expect(result.is_active).toBe(true);
  });

  it('iot listAlerts acknowledged transform', () => {
    const result = iotContract.listAlerts.query.parse({ acknowledged: 'true' });
    expect(result.acknowledged).toBe(true);
  });

  it('iot listThresholds is_active transform', () => {
    const result = iotContract.listThresholds.query.parse({ is_active: 'true' });
    expect(result.is_active).toBe(true);
  });

  it('cultivation plants.list is_active transform', () => {
    const result = cultivationContract.plants.list.query.parse({ is_active: 'true' });
    expect(result.is_active).toBe(true);
  });

  it('procurement listSuppliers is_active transform', () => {
    const result = procurementContract.listSuppliers.query.parse({ is_active: 'true' });
    expect(result.is_active).toBe(true);
  });

  it('spatial listZones is_active transform', () => {
    const result = spatialContract.listZones.query.parse({ is_active: 'true' });
    expect(result.is_active).toBe(true);
  });
});
