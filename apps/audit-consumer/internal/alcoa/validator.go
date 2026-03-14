// Package alcoa implements ALCOA+ data integrity validation for audit events.
// ALCOA+ principles: Attributable, Legible, Contemporaneous, Original, Accurate,
// Complete, Consistent, Enduring, Available.
package alcoa

import (
	"fmt"
	"time"
)

const (
	// MaxTimestampDeltaSeconds is the maximum allowed delta between event
	// occurredAt and current time for the Contemporaneous check.
	MaxTimestampDeltaSeconds = 120

	SeverityCritical = "CRITICAL"
	SeverityMajor    = "MAJOR"
	SeverityMinor    = "MINOR"
)

// Violation represents a single ALCOA+ principle violation.
type Violation struct {
	Principle string
	Severity  string
	Message   string
}

// Validate checks the audit event payload against all ALCOA+ principles.
// Returns all violations found (non-fail-fast — collects all issues).
func Validate(payload map[string]interface{}, occurredAt string) []Violation {
	var violations []Violation

	// ── Attributable: must have user identity ────────────────────────────────
	if !hasNonEmpty(payload, "userId", "user_id", "operatorId") {
		violations = append(violations, Violation{
			Principle: "Attributable",
			Severity:  SeverityCritical,
			Message:   "Audit event missing user identity (userId / user_id / operatorId)",
		})
	}

	// ── Legible: event type must be present and a string ─────────────────────
	if !hasNonEmpty(payload, "eventType", "action") {
		violations = append(violations, Violation{
			Principle: "Legible",
			Severity:  SeverityMajor,
			Message:   "Audit event missing eventType or action descriptor",
		})
	}

	// ── Contemporaneous: timestamp must be within 2 minutes of now ───────────
	if occurredAt != "" {
		t, err := time.Parse(time.RFC3339Nano, occurredAt)
		if err != nil {
			violations = append(violations, Violation{
				Principle: "Contemporaneous",
				Severity:  SeverityMajor,
				Message:   fmt.Sprintf("Cannot parse occurredAt timestamp: %s", occurredAt),
			})
		} else {
			delta := time.Since(t).Seconds()
			if delta < 0 {
				delta = -delta
			}
			if delta > MaxTimestampDeltaSeconds {
				violations = append(violations, Violation{
					Principle: "Contemporaneous",
					Severity:  SeverityMajor,
					Message: fmt.Sprintf(
						"Timestamp delta %.0f s exceeds maximum %d s",
						delta, MaxTimestampDeltaSeconds,
					),
				})
			}
		}
	} else {
		violations = append(violations, Violation{
			Principle: "Contemporaneous",
			Severity:  SeverityCritical,
			Message:   "occurredAt timestamp is missing",
		})
	}

	// ── Original: eventId must be present (de-duplication token) ─────────────
	if !hasNonEmpty(payload, "eventId", "id") {
		violations = append(violations, Violation{
			Principle: "Original",
			Severity:  SeverityMajor,
			Message:   "Audit event missing unique eventId — cannot guarantee originality",
		})
	}

	// ── Accurate: entity type and ID should be present for traceability ───────
	if !hasNonEmpty(payload, "entityType") {
		violations = append(violations, Violation{
			Principle: "Accurate",
			Severity:  SeverityMinor,
			Message:   "Audit event missing entityType for accuracy traceability",
		})
	}

	// ── Complete: correlationId for cross-service trace ───────────────────────
	if !hasNonEmpty(payload, "correlationId") {
		violations = append(violations, Violation{
			Principle: "Complete",
			Severity:  SeverityMinor,
			Message:   "Missing correlationId — event chain may be incomplete",
		})
	}

	return violations
}

// hasNonEmpty returns true if the payload map contains at least one of the
// given keys with a non-empty string value.
func hasNonEmpty(payload map[string]interface{}, keys ...string) bool {
	for _, key := range keys {
		if v, ok := payload[key]; ok {
			if s, isStr := v.(string); isStr && s != "" {
				return true
			}
		}
	}
	return false
}
