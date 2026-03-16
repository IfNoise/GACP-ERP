package alcoa_test

import (
	"fmt"
	"testing"
	"time"

	"github.com/gacp-erp/audit-consumer/internal/alcoa"
)

// ─── helper ──────────────────────────────────────────────────────────────────

// validPayload returns a minimal payload that passes all ALCOA+ checks.
func validPayload() map[string]interface{} {
	return map[string]interface{}{
		"userId":        "user-001",
		"eventType":     "PLANT_STAGE_CHANGED",
		"eventId":       "evt-001",
		"entityType":    "plant",
		"correlationId": "corr-001",
	}
}

func nowRFC3339() string {
	return time.Now().UTC().Format(time.RFC3339Nano)
}

// containsViolation returns true if violations slice contains an entry with the given principle.
func containsViolation(violations []alcoa.Violation, principle string) bool {
	for _, v := range violations {
		if v.Principle == principle {
			return true
		}
	}
	return false
}

// violationBySeverity returns the first violation matching both principle and severity.
func violationBySeverity(violations []alcoa.Violation, principle, severity string) *alcoa.Violation {
	for i, v := range violations {
		if v.Principle == principle && v.Severity == severity {
			return &violations[i]
		}
	}
	return nil
}

// ─── happy path ──────────────────────────────────────────────────────────────

func TestValidate_ValidEvent_NoViolations(t *testing.T) {
	violations := alcoa.Validate(validPayload(), nowRFC3339())
	if len(violations) != 0 {
		t.Errorf("expected 0 violations, got %d: %+v", len(violations), violations)
	}
}

// ─── Attributable ────────────────────────────────────────────────────────────

func TestValidate_MissingUserId_AttributableViolation(t *testing.T) {
	payload := validPayload()
	delete(payload, "userId")

	violations := alcoa.Validate(payload, nowRFC3339())
	if !containsViolation(violations, "Attributable") {
		t.Error("expected Attributable violation when userId is missing")
	}

	v := violationBySeverity(violations, "Attributable", alcoa.SeverityCritical)
	if v == nil {
		t.Error("expected severity CRITICAL for missing userId")
	}
}

func TestValidate_AlternativeUserIdKeys(t *testing.T) {
	cases := []struct {
		key   string
		value string
	}{
		{"user_id", "u-001"},
		{"operatorId", "op-001"},
	}

	for _, tc := range cases {
		t.Run(fmt.Sprintf("key=%s", tc.key), func(t *testing.T) {
			payload := validPayload()
			delete(payload, "userId")
			payload[tc.key] = tc.value

			violations := alcoa.Validate(payload, nowRFC3339())
			if containsViolation(violations, "Attributable") {
				t.Errorf("expected no Attributable violation when %s is set", tc.key)
			}
		})
	}
}

// ─── Legible ─────────────────────────────────────────────────────────────────

func TestValidate_MissingEventType_LegibleViolation(t *testing.T) {
	payload := validPayload()
	delete(payload, "eventType")

	violations := alcoa.Validate(payload, nowRFC3339())
	if !containsViolation(violations, "Legible") {
		t.Error("expected Legible violation when eventType and action are missing")
	}
}

func TestValidate_ActionKeyAcceptedForLegibility(t *testing.T) {
	payload := validPayload()
	delete(payload, "eventType")
	payload["action"] = "PLANT_CREATED"

	violations := alcoa.Validate(payload, nowRFC3339())
	if containsViolation(violations, "Legible") {
		t.Error("expected no Legible violation when action key is present")
	}
}

// ─── Contemporaneous ─────────────────────────────────────────────────────────

func TestValidate_MissingTimestamp_ContemporaneousViolation(t *testing.T) {
	violations := alcoa.Validate(validPayload(), "")
	if !containsViolation(violations, "Contemporaneous") {
		t.Error("expected Contemporaneous violation when occurredAt is empty")
	}
	v := violationBySeverity(violations, "Contemporaneous", alcoa.SeverityCritical)
	if v == nil {
		t.Error("expected CRITICAL severity for missing occurredAt")
	}
}

func TestValidate_InvalidTimestampFormat_ContemporaneousViolation(t *testing.T) {
	violations := alcoa.Validate(validPayload(), "not-a-timestamp")
	if !containsViolation(violations, "Contemporaneous") {
		t.Error("expected Contemporaneous violation for unparseable timestamp")
	}
}

func TestValidate_StaleTimestamp_ContemporaneousViolation(t *testing.T) {
	stale := time.Now().Add(-5 * time.Minute).UTC().Format(time.RFC3339Nano)

	violations := alcoa.Validate(validPayload(), stale)
	if !containsViolation(violations, "Contemporaneous") {
		t.Error("expected Contemporaneous violation for timestamp >120 s old")
	}
}

func TestValidate_RecentTimestamp_NoContemporaneousViolation(t *testing.T) {
	recent := time.Now().Add(-60 * time.Second).UTC().Format(time.RFC3339Nano)

	violations := alcoa.Validate(validPayload(), recent)
	if containsViolation(violations, "Contemporaneous") {
		t.Error("unexpected Contemporaneous violation for timestamp within window")
	}
}

// ─── Original ────────────────────────────────────────────────────────────────

func TestValidate_MissingEventId_OriginalViolation(t *testing.T) {
	payload := validPayload()
	delete(payload, "eventId")

	violations := alcoa.Validate(payload, nowRFC3339())
	if !containsViolation(violations, "Original") {
		t.Error("expected Original violation when eventId is missing")
	}
}

func TestValidate_IdKeyAcceptedForOriginal(t *testing.T) {
	payload := validPayload()
	delete(payload, "eventId")
	payload["id"] = "some-id"

	violations := alcoa.Validate(payload, nowRFC3339())
	if containsViolation(violations, "Original") {
		t.Error("expected no Original violation when id key is present")
	}
}

// ─── Accurate ────────────────────────────────────────────────────────────────

func TestValidate_MissingEntityType_AccurateViolation(t *testing.T) {
	payload := validPayload()
	delete(payload, "entityType")

	violations := alcoa.Validate(payload, nowRFC3339())
	if !containsViolation(violations, "Accurate") {
		t.Error("expected Accurate violation when entityType is missing")
	}
	v := violationBySeverity(violations, "Accurate", alcoa.SeverityMinor)
	if v == nil {
		t.Error("expected MINOR severity for missing entityType")
	}
}

// ─── Complete ────────────────────────────────────────────────────────────────

func TestValidate_MissingCorrelationId_CompleteViolation(t *testing.T) {
	payload := validPayload()
	delete(payload, "correlationId")

	violations := alcoa.Validate(payload, nowRFC3339())
	if !containsViolation(violations, "Complete") {
		t.Error("expected Complete violation when correlationId is missing")
	}
}

// ─── non-fail-fast: multiple violations ──────────────────────────────────────

func TestValidate_MultipleViolations_AllCollected(t *testing.T) {
	// Empty payload — triggers Attributable + Legible + Original + Accurate + Complete
	violations := alcoa.Validate(map[string]interface{}{}, nowRFC3339())

	if len(violations) < 4 {
		t.Errorf("expected at least 4 violations for empty payload, got %d: %+v", len(violations), violations)
	}

	expected := []string{"Attributable", "Legible", "Original", "Complete"}
	for _, principle := range expected {
		if !containsViolation(violations, principle) {
			t.Errorf("expected %s violation in results", principle)
		}
	}
}
