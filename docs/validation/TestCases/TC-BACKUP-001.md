---
title: "Disaster Recovery: Backup & Restore Validation"
module: "Infrastructure & Data Protection"
urs_id: "URS-BACKUP-001"
fs_id: "FS-BACKUP-001"
ds_id: "DS-BACKUP-001"
iq_oq_pq_step: "PQ-BACKUP-001"
version: "1.0"
status: "active"
last_updated: "2025-10-15"
test_priority: "Critical"
regulatory_impact: "Critical - FDA 21 CFR Part 11, EU GMP Annex 11, Data Integrity"
---

# TC-BACKUP-001: Disaster Recovery - Backup & Restore Validation

## 1. Purpose

Валидация процедур резервного копирования и восстановления данных GACP-ERP системы в соответствии с требованиями:
- FDA 21 CFR Part 11 (Backup and disaster recovery)
- EU GMP Annex 11 (Business continuity)
- Data Integrity (MHRA) - Ensuring data availability and authenticity
- ISO 22301 (Business Continuity Management)

**Critical Requirements:**
- RTO (Recovery Time Objective): < 4 часа
- RPO (Recovery Point Objective): < 15 минут
- Zero data loss для audit trail
- Сохранение e-signatures после восстановления
- WORM storage compliance

## 2. Scope

**Тестируемые компоненты:**
- PostgreSQL database backup/restore
- MongoDB audit consumer backup/restore
- MinIO/S3 file storage backup
- Application configuration backup
- WORM storage verification
- Replication lag monitoring
- Integrity verification после restore

## 3. Preconditions

### 3.1 Infrastructure Setup
- ✅ Primary PostgreSQL (Master) запущен
- ✅ Standby PostgreSQL (Replica) активен
- ✅ MongoDB Audit Consumer запущен
- ✅ MinIO/S3 storage доступен
- ✅ WORM bucket настроен с retention policy
- ✅ Backup scripts deployed
- ✅ Test environment isolated (не production!)

### 3.2 Backup Configuration
- ✅ Automated daily backups активны
- ✅ Backup retention: 30 days
- ✅ Backup location: `/mnt/backup/gacp-erp/`
- ✅ WORM storage: `s3://gacp-worm-backup/`
- ✅ Replication lag < 5 seconds

### 3.3 Test Data
- **Test Batch**: BATCH-TEST-999
- **Test Plants**: 50 plants (PLANT-TEST-001 to PLANT-TEST-050)
- **Test Audit Events**: 200+ events
- **Test E-Signatures**: 10 signed documents
- **Test Files**: 20 photos/documents в MinIO

### 3.4 Users
- **IT Admin**: `it.admin@gacp-test.com` / `Test123!`
- **DBA**: `dba@gacp-test.com` / `Test123!`

## 4. Test Steps

### Step 1: Pre-Backup System State Verification

**Action:**
```bash
1.1. Login to database server as DBA
1.2. Verify database state:
     psql -U postgres -d gacp_erp -c "
       SELECT count(*) FROM plants WHERE batch_id = 'BATCH-TEST-999';
       SELECT count(*) FROM audit_trail WHERE table_name = 'plants';
       SELECT count(*) FROM e_signatures;
     "
1.3. Record counts:
     - Plants: _____
     - Audit Events: _____
     - E-Signatures: _____
1.4. Calculate database checksum:
     pg_dump gacp_erp | md5sum > /tmp/pre_backup_checksum.txt
```

**Expected Result:**
- ✅ Database accessible
- ✅ Plants count: 50
- ✅ Audit events count: >200
- ✅ E-signatures count: 10
- ✅ Checksum recorded

---

### Step 2: Create Full Backup

**Action:**
```bash
2.1. Execute backup script:
     ./scripts/backup_full.sh
2.2. Monitor backup progress:
     tail -f /var/log/gacp-erp/backup.log
2.3. Verify backup files created:
     ls -lh /mnt/backup/gacp-erp/$(date +%Y-%m-%d)/
```

**Expected Result:**
- ✅ Backup completed without errors
- ✅ Backup time < 30 минут
- ✅ Files created:
  - `postgresql_backup_YYYYMMDD_HHMMSS.dump` (~500 MB)
  - `mongodb_audit_backup_YYYYMMDD_HHMMSS.archive` (~200 MB)
  - `minio_files_backup_YYYYMMDD_HHMMSS.tar.gz` (~1 GB)
  - `config_backup_YYYYMMDD_HHMMSS.tar.gz` (~10 MB)
  - `backup_manifest.json` (metadata)
- ✅ All backup files uploaded to WORM storage
- ✅ Backup integrity checksums generated
- ✅ Backup log содержит success status

---

### Step 3: Verify Backup Integrity

**Action:**
```bash
3.1. Verify PostgreSQL backup:
     pg_restore --list /mnt/backup/gacp-erp/.../postgresql_backup_*.dump
3.2. Verify MongoDB backup:
     mongorestore --dry-run --archive=mongodb_audit_backup_*.archive
3.3. Verify file checksums:
     sha256sum -c backup_checksums.txt
3.4. Verify WORM upload:
     aws s3 ls s3://gacp-worm-backup/$(date +%Y-%m-%d)/
```

**Expected Result:**
- ✅ PostgreSQL backup listable (contains all tables)
- ✅ MongoDB backup readable
- ✅ All file checksums match
- ✅ Files present in WORM storage
- ✅ WORM retention policy active (cannot delete)

---

### Step 4: Simulate Data Loss (Disaster Scenario)

**Action:**
```bash
4.1. Stop application services:
     systemctl stop gacp-erp-api
     systemctl stop gacp-erp-worker
4.2. Delete test data from PostgreSQL:
     psql -U postgres -d gacp_erp -c "
       DELETE FROM plants WHERE batch_id = 'BATCH-TEST-999';
       DELETE FROM plant_events WHERE plant_id IN 
         (SELECT id FROM plants WHERE batch_id = 'BATCH-TEST-999');
     "
4.3. Corrupt some audit trail data:
     psql -U postgres -d gacp_erp -c "
       DELETE FROM audit_trail WHERE table_name = 'plants' 
       LIMIT 50;
     "
4.4. Delete files from MinIO:
     mc rm --recursive minio/gacp-files/test-batch-999/
4.5. Verify data loss:
     psql -U postgres -d gacp_erp -c "
       SELECT count(*) FROM plants WHERE batch_id = 'BATCH-TEST-999';
     "
```

**Expected Result:**
- ✅ Services stopped
- ✅ Plants count: 0 (deleted)
- ✅ Audit trail events: reduced
- ✅ Files deleted from MinIO
- ✅ **DATA LOSS CONFIRMED** (disaster scenario active)

---

### Step 5: Execute Database Restore

**Action:**
```bash
5.1. Drop and recreate database:
     psql -U postgres -c "DROP DATABASE gacp_erp;"
     psql -U postgres -c "CREATE DATABASE gacp_erp;"
5.2. Restore PostgreSQL backup:
     pg_restore -U postgres -d gacp_erp \
       /mnt/backup/gacp-erp/.../postgresql_backup_*.dump
5.3. Monitor restore progress:
     tail -f /var/log/postgresql/postgresql-*.log
5.4. Verify restore completion:
     psql -U postgres -d gacp_erp -c "
       SELECT count(*) FROM plants WHERE batch_id = 'BATCH-TEST-999';
     "
```

**Expected Result:**
- ✅ Database restored successfully
- ✅ Restore time < 1 hour
- ✅ Plants count: 50 (restored)
- ✅ All tables restored
- ✅ No errors in restore log

---

### Step 6: Restore MongoDB Audit Data

**Action:**
```bash
6.1. Stop MongoDB:
     systemctl stop mongod
6.2. Clear audit collection:
     mongo audit_db --eval "db.audit_trail.drop()"
6.3. Restore MongoDB:
     mongorestore --archive=/mnt/backup/.../mongodb_audit_backup_*.archive
6.4. Start MongoDB:
     systemctl start mongod
6.5. Verify audit events:
     mongo audit_db --eval "db.audit_trail.count({table_name: 'plants'})"
```

**Expected Result:**
- ✅ MongoDB restored
- ✅ Audit events count: >200 (restored)
- ✅ All audit trail events present
- ✅ MongoDB indexes rebuilt

---

### Step 7: Restore MinIO Files

**Action:**
```bash
7.1. Extract file backup:
     tar -xzf minio_files_backup_*.tar.gz -C /tmp/restore/
7.2. Upload files to MinIO:
     mc mirror /tmp/restore/ minio/gacp-files/
7.3. Verify files:
     mc ls --recursive minio/gacp-files/test-batch-999/
7.4. Check file count:
     mc ls --recursive minio/gacp-files/test-batch-999/ | wc -l
```

**Expected Result:**
- ✅ Files extracted
- ✅ Files uploaded to MinIO
- ✅ File count: 20 (restored)
- ✅ File checksums match original

---

### Step 8: Restore Application Configuration

**Action:**
```bash
8.1. Extract config backup:
     tar -xzf config_backup_*.tar.gz -C /tmp/restore-config/
8.2. Copy configs to application directory:
     cp /tmp/restore-config/*.env /opt/gacp-erp/
     cp /tmp/restore-config/*.yaml /opt/gacp-erp/config/
8.3. Restart services:
     systemctl start gacp-erp-api
     systemctl start gacp-erp-worker
8.4. Check service status:
     systemctl status gacp-erp-*
```

**Expected Result:**
- ✅ Configurations restored
- ✅ Services started successfully
- ✅ API responds to health check
- ✅ No configuration errors in logs

---

### Step 9: Verify Data Integrity Post-Restore

**Action:**
```bash
9.1. Calculate post-restore checksum:
     pg_dump gacp_erp | md5sum > /tmp/post_restore_checksum.txt
9.2. Compare checksums:
     diff /tmp/pre_backup_checksum.txt /tmp/post_restore_checksum.txt
9.3. Verify specific data:
     psql -U postgres -d gacp_erp -c "
       SELECT plant_code, strain_id, stage, health_score 
       FROM plants 
       WHERE batch_id = 'BATCH-TEST-999' 
       ORDER BY plant_code 
       LIMIT 10;
     "
9.4. Cross-reference with backup manifest
```

**Expected Result:**
- ✅ Checksums match (identical data)
- ✅ All 50 plants present with correct data
- ✅ Plant stages, health scores match original
- ✅ Timestamps preserved
- ✅ Foreign key relationships intact

---

### Step 10: Verify Audit Trail Integrity

**Action:**
```bash
10.1. Check audit trail completeness:
      SELECT 
        MIN(changed_at) as first_event,
        MAX(changed_at) as last_event,
        COUNT(*) as total_events
      FROM audit_trail
      WHERE table_name = 'plants';
10.2. Verify no gaps in timeline:
      SELECT 
        changed_at, 
        operation, 
        changed_by 
      FROM audit_trail 
      WHERE table_name = 'plants'
      ORDER BY changed_at;
10.3. Check audit hash chain integrity:
      SELECT verify_audit_chain('plants');
```

**Expected Result:**
- ✅ All >200 audit events present
- ✅ Timeline continuous (no gaps)
- ✅ First/last event timestamps match original
- ✅ Audit hash chain valid (integrity preserved)
- ✅ All changed_by user IDs valid

---

### Step 11: Verify E-Signatures Validity

**Action:**
```bash
11.1. Check e-signatures:
      SELECT 
        id, 
        document_id, 
        signed_by, 
        signed_at, 
        signature_hash 
      FROM e_signatures 
      ORDER BY signed_at;
11.2. Verify signature hashes:
      SELECT verify_signature_hash(id) 
      FROM e_signatures;
11.3. Check linked documents exist:
      SELECT s.id, d.id, d.title 
      FROM e_signatures s 
      LEFT JOIN documents d ON s.document_id = d.id;
```

**Expected Result:**
- ✅ All 10 e-signatures present
- ✅ Signature hashes valid (SHA-256 matches)
- ✅ signed_by user IDs valid
- ✅ All linked documents exist
- ✅ Timestamps preserved
- ✅ No orphaned signatures

---

### Step 12: Application Functional Test

**Action:**
```bash
12.1. Login to web interface as IT Admin
12.2. Navigate to Plants module
12.3. Open BATCH-TEST-999
12.4. Verify all 50 plants displayed
12.5. Open random plant details (PLANT-TEST-025)
12.6. Check plant history and events
12.7. View attached photos
12.8. Generate Plant Lifecycle Report
```

**Expected Result:**
- ✅ Login successful
- ✅ Batch visible in UI
- ✅ All 50 plants listed
- ✅ Plant details complete
- ✅ History timeline intact
- ✅ Photos display correctly
- ✅ Report generates without errors
- ✅ No UI errors or missing data

---

### Step 13: Performance Verification

**Action:**
```bash
13.1. Measure query performance:
      EXPLAIN ANALYZE 
      SELECT * FROM plants WHERE batch_id = 'BATCH-TEST-999';
13.2. Check database statistics:
      SELECT * FROM pg_stat_database WHERE datname = 'gacp_erp';
13.3. Verify indexes:
      SELECT * FROM pg_indexes WHERE tablename = 'plants';
```

**Expected Result:**
- ✅ Query performance normal (< 100ms)
- ✅ All indexes present and functional
- ✅ Database statistics healthy
- ✅ No degraded performance post-restore

---

### Step 14: WORM Storage Immutability Test

**Action:**
```bash
14.1. Attempt to delete backup from WORM:
      aws s3 rm s3://gacp-worm-backup/.../postgresql_backup_*.dump
14.2. Attempt to modify backup:
      echo "corrupt" >> /mnt/backup/.../postgresql_backup_*.dump
      aws s3 cp /mnt/backup/.../postgresql_backup_*.dump \
        s3://gacp-worm-backup/.../postgresql_backup_*.dump
14.3. Check bucket retention policy:
      aws s3api get-object-lock-configuration \
        --bucket gacp-worm-backup
```

**Expected Result:**
- ✅ Delete operation DENIED (Access Denied error)
- ✅ Modify operation DENIED (Cannot overwrite)
- ✅ Retention policy active: 30 days COMPLIANCE mode
- ✅ WORM compliance verified

## 5. Expected Results (Summary)

### Recovery Objectives
- ✅ RTO achieved: < 4 hours (actual: _____ hours)
- ✅ RPO achieved: < 15 minutes (no data loss)
- ✅ Full system recovery successful

### Data Integrity
- ✅ Database checksum matches pre-backup state
- ✅ All 50 test plants recovered
- ✅ All >200 audit events recovered
- ✅ All 10 e-signatures valid
- ✅ All 20 files restored

### Compliance
- ✅ FDA 21 CFR Part 11: Audit trail complete and immutable
- ✅ EU GMP Annex 11: Business continuity maintained
- ✅ Data Integrity: ALCOA+ compliance verified
- ✅ WORM storage: Immutability verified

## 6. Actual Results

**Test Execution Date:** _________________  
**Tester:** _________________  
**Environment:** _________________

| Step | Status | Duration | Comments |
|------|--------|----------|----------|
| 1-2 | ☐ Pass ☐ Fail | _____ min | |
| 3 | ☐ Pass ☐ Fail | _____ min | |
| 4 | ☐ Pass ☐ Fail | _____ min | |
| 5 | ☐ Pass ☐ Fail | _____ min | |
| 6 | ☐ Pass ☐ Fail | _____ min | |
| 7 | ☐ Pass ☐ Fail | _____ min | |
| 8 | ☐ Pass ☐ Fail | _____ min | |
| 9 | ☐ Pass ☐ Fail | _____ min | |
| 10 | ☐ Pass ☐ Fail | _____ min | |
| 11 | ☐ Pass ☐ Fail | _____ min | |
| 12 | ☐ Pass ☐ Fail | _____ min | |
| 13 | ☐ Pass ☐ Fail | _____ min | |
| 14 | ☐ Pass ☐ Fail | _____ min | |

**Total Recovery Time:** _____ hours _____ minutes  
**Overall Test Result:** ☐ PASS ☐ FAIL  
**RTO Met:** ☐ YES ☐ NO  
**RPO Met:** ☐ YES ☐ NO

## 7. Test Evidence

**Required Attachments:**
1. Backup logs (backup.log)
2. Restore logs (restore.log)
3. Checksum comparison (diff output)
4. Screenshots of restored data in UI
5. Audit trail export before/after
6. E-signatures validation report
7. Performance metrics

## 8. Cleanup

**Post-Test Actions:**
```bash
1. Keep test backup for audit purposes
2. Document lessons learned
3. Update DR procedures if needed
4. Archive test evidence
```

## 9. Approvals

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Test Author | | | |
| Test Reviewer | | | |
| IT Manager | | | |
| QA Manager | | | |

---

**Revision History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 2025-09-01 | Initial | Draft version |
| 1.0 | 2025-10-15 | AI Assistant | Complete DR test with WORM validation |
