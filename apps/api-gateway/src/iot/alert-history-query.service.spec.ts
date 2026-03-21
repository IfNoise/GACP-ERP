import { AlertHistoryQueryService } from './alert-history-query.service';

// ─── Mock DB (Drizzle-like) ───────────────────────────────────────────────────

const NOW = new Date('2026-01-15T12:00:00Z');

const ROW = {
  id: 'ah-1',
  threshold_id: 'th-1',
  zone_id: 'zone-001',
  sensor_type: 'temperature',
  triggered_value: '28.5',
  alert_level: 'WARNING',
  triggered_at: NOW,
  acknowledged: false,
  acknowledged_by: null,
  acknowledged_at: null,
  source_hash: 'abc123',
};

function makeDb(rows: unknown[] = [ROW], countRows: unknown[] = [{ id: 'ah-1' }]) {
  const selectMock = jest.fn();
  const fromMock = jest.fn();
  const whereMock = jest.fn();
  const orderByMock = jest.fn();
  const limitMock = jest.fn();
  const offsetMock = jest.fn();

  // main query chain: db.select().from(table).where(w).orderBy(o).limit(l).offset(o)
  selectMock.mockReturnValue({ from: fromMock });
  fromMock.mockReturnValue({ where: whereMock });
  whereMock.mockReturnValue({ orderBy: orderByMock });
  orderByMock.mockReturnValue({ limit: limitMock });
  limitMock.mockReturnValue({ offset: offsetMock });
  offsetMock.mockResolvedValue(rows);

  // count query chain: db.select({id}).from(table).where(w)
  const countFromMock = jest.fn();
  const countWhereMock = jest.fn();
  countFromMock.mockReturnValue({ where: countWhereMock });
  countWhereMock.mockResolvedValue(countRows);

  // On second call to .select(), return the count chain
  let callCount = 0;
  const smartSelect = jest.fn(() => {
    callCount++;
    if (callCount === 1) return { from: fromMock };
    return { from: countFromMock };
  });

  return {
    db: { select: smartSelect },
    mocks: { selectMock: smartSelect, fromMock, whereMock, orderByMock, limitMock, offsetMock },
  };
}

describe('AlertHistoryQueryService', () => {
  it('returns paginated results with default filters', async () => {
    const { db } = makeDb();
    const service = new AlertHistoryQueryService(db as never);

    const result = await service.findAll({ page: 1, limit: 20 });

    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.totalPages).toBe(1);
    expect(result.data[0]!.id).toBe('ah-1');
    expect(result.data[0]!.triggered_value).toBe(28.5);
    expect(result.data[0]!.triggered_at).toBe('2026-01-15T12:00:00.000Z');
    expect(result.data[0]!.acknowledged_at).toBeNull();
  });

  it('applies all optional filters', async () => {
    const { db } = makeDb([], []);
    const service = new AlertHistoryQueryService(db as never);

    const result = await service.findAll({
      page: 2,
      limit: 10,
      zone_id: 'zone-001',
      sensor_type: 'temperature',
      alert_level: 'CRITICAL',
      acknowledged: true,
      from: '2026-01-01',
      to: '2026-12-31',
    });

    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(0);
  });

  it('maps acknowledged_at when present', async () => {
    const rowWithAck = {
      ...ROW,
      acknowledged: true,
      acknowledged_by: 'user-1',
      acknowledged_at: new Date('2026-01-16T08:00:00Z'),
    };
    const { db } = makeDb([rowWithAck]);
    const service = new AlertHistoryQueryService(db as never);

    const result = await service.findAll({ page: 1, limit: 20 });
    expect(result.data[0]!.acknowledged_at).toBe('2026-01-16T08:00:00.000Z');
  });
});
