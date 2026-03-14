package kafka

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/gacp-erp/audit-consumer/internal/alcoa"
	"github.com/gacp-erp/audit-consumer/internal/immudb"
	kafkago "github.com/segmentio/kafka-go"
	"go.uber.org/zap"
)

// Config holds Kafka consumer configuration.
type Config struct {
	Brokers    []string
	GroupID    string
	Topics     []string
	ImmuClient *immudb.Client
	Logger     *zap.Logger
}

// Consumer consumes Kafka messages and writes audit events to ImmuDB.
type Consumer struct {
	cfg    Config
	reader *kafkago.Reader
}

// New creates a new Kafka Consumer.
func New(cfg Config) *Consumer {
	reader := kafkago.NewReader(kafkago.ReaderConfig{
		Brokers:        cfg.Brokers,
		GroupID:        cfg.GroupID,
		GroupTopics:    cfg.Topics,
		MinBytes:       1,
		MaxBytes:       10e6, // 10 MB
		MaxWait:        500 * time.Millisecond,
		CommitInterval: time.Second,
		// Start from latest if no committed offset
		StartOffset: kafkago.LastOffset,
	})

	return &Consumer{cfg: cfg, reader: reader}
}

// Run starts the consuming loop. Blocks until ctx is cancelled.
func (c *Consumer) Run(ctx context.Context) error {
	defer func() { _ = c.reader.Close() }()

	c.cfg.Logger.Info("Consumer loop started")

	for {
		msg, err := c.reader.FetchMessage(ctx)
		if err != nil {
			if ctx.Err() != nil {
				// Context cancelled — clean shutdown
				return nil
			}
			c.cfg.Logger.Error("Failed to fetch Kafka message", zap.Error(err))
			continue
		}

		if processErr := c.processMessage(ctx, msg); processErr != nil {
			c.cfg.Logger.Error("Failed to process message",
				zap.String("topic", msg.Topic),
				zap.Int64("offset", msg.Offset),
				zap.Error(processErr),
			)
			// DO NOT commit — message will be re-delivered
			continue
		}

		if commitErr := c.reader.CommitMessages(ctx, msg); commitErr != nil {
			c.cfg.Logger.Warn("Failed to commit offset",
				zap.String("topic", msg.Topic),
				zap.Int64("offset", msg.Offset),
				zap.Error(commitErr),
			)
		}
	}
}

// AuditEventPayload is the expected JSON structure from audit.trail.v1 topic.
type AuditEventPayload struct {
	EventID       string                 `json:"eventId"`
	EventType     string                 `json:"eventType"`
	OccurredAt    string                 `json:"occurredAt"`
	ProducerSvc   string                 `json:"producerService"`
	CorrelationID string                 `json:"correlationId"`
	Payload       map[string]interface{} `json:"payload"`
}

func (c *Consumer) processMessage(ctx context.Context, msg kafkago.Message) error {
	c.cfg.Logger.Debug("Processing message",
		zap.String("topic", msg.Topic),
		zap.Int64("offset", msg.Offset),
		zap.Int("size", len(msg.Value)),
	)

	var event AuditEventPayload
	if err := json.Unmarshal(msg.Value, &event); err != nil {
		return fmt.Errorf("JSON unmarshal failed: %w", err)
	}

	// ALCOA+ validation
	violations := alcoa.Validate(event.Payload, event.OccurredAt)
	if len(violations) > 0 {
		c.cfg.Logger.Warn("ALCOA+ violations detected",
			zap.String("eventId", event.EventID),
			zap.Int("violationCount", len(violations)),
			zap.Any("violations", violations),
		)
		// Critical violations block write; non-critical are logged only
		for _, v := range violations {
			if v.Severity == "CRITICAL" {
				return fmt.Errorf("CRITICAL ALCOA+ violation: %s — %s", v.Principle, v.Message)
			}
		}
	}

	// Write to ImmuDB for tamper-evident storage
	txID, err := c.cfg.ImmuClient.WriteAuditEvent(ctx, immudb.AuditEntry{
		Key:        fmt.Sprintf("audit:%s:%s", event.EventType, event.EventID),
		EventID:    event.EventID,
		EventType:  event.EventType,
		Topic:      msg.Topic,
		Payload:    string(msg.Value),
		ReceivedAt: time.Now().UTC().Format(time.RFC3339Nano),
	})
	if err != nil {
		return fmt.Errorf("ImmuDB write failed: %w", err)
	}

	c.cfg.Logger.Info("Audit event written to ImmuDB",
		zap.String("eventId", event.EventID),
		zap.String("eventType", event.EventType),
		zap.Uint64("txId", txID),
	)

	return nil
}
