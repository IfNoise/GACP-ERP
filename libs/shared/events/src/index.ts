// ─── Base (EventHeader + SopReference) ───────────────────────────────────────
export * from './base.events';

// ─── Domain events ────────────────────────────────────────────────────────────
export * from './plant.events';
export * from './facility.events';
export * from './audit.events';

export * from './iot.events';
export * from './quality.events';

// ─── EPIC 8 ───────────────────────────────────────────────────────────────────
export * from './financial.events';
export * from './procurement.events';
export * from './spatial.events';

// ─── Topic registry ───────────────────────────────────────────────────────────
export { CULTIVATION_TOPIC } from './plant.events';
export { FACILITY_TOPIC } from './facility.events';
export { AUDIT_TOPIC } from './audit.events';
export { IOT_ALERTS_TOPIC } from './iot.events';
export {
  QUALITY_CHANGE_TOPIC,
  QUALITY_CAPA_TOPIC,
  QUALITY_DEVIATION_TOPIC,
} from './quality.events';
export { FINANCE_TRANSACTION_TOPIC } from './financial.events';
export { PROCUREMENT_PO_TOPIC } from './procurement.events';
export { SPATIAL_ZONE_TOPIC } from './spatial.events';
