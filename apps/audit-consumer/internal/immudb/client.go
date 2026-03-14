package immudb

import (
	"context"
	"fmt"

	immuclient "github.com/codenotary/immudb/pkg/client"
	"go.uber.org/zap"
)

// Config holds ImmuDB connection settings.
type Config struct {
	Host     string
	Port     int
	Username string
	Password string
	Database string
	Logger   *zap.Logger
}

// Client is a wrapper around the ImmuDB gRPC client.
type Client struct {
	inner  immuclient.ImmuClient
	cfg    Config
	logger *zap.Logger
}

// AuditEntry represents a single audit record to persist.
type AuditEntry struct {
	Key        string
	EventID    string
	EventType  string
	Topic      string
	Payload    string
	ReceivedAt string
}

// NewClient opens a connection to ImmuDB and authenticates.
func NewClient(cfg Config) (*Client, error) {
	opts := immuclient.DefaultOptions().
		WithAddress(cfg.Host).
		WithPort(cfg.Port)

	client := immuclient.NewClient().WithOptions(opts)

	ctx := context.Background()

	if err := client.OpenSession(ctx, []byte(cfg.Username), []byte(cfg.Password), cfg.Database); err != nil {
		return nil, fmt.Errorf("ImmuDB OpenSession failed: %w", err)
	}

	return &Client{
		inner:  client,
		cfg:    cfg,
		logger: cfg.Logger,
	}, nil
}

// WriteAuditEvent appends an audit entry to the ImmuDB ledger.
// Returns the transaction ID which can be used for inclusion proof verification.
func (c *Client) WriteAuditEvent(ctx context.Context, entry AuditEntry) (uint64, error) {
	// Use a structured KV set with JSON payload as value
	txMeta, err := c.inner.Set(ctx, []byte(entry.Key), []byte(entry.Payload))
	if err != nil {
		return 0, fmt.Errorf("ImmuDB Set failed for key %q: %w", entry.Key, err)
	}

	c.logger.Debug("ImmuDB Set successful",
		zap.String("key", entry.Key),
		zap.Uint64("txId", txMeta.Id),
	)

	return txMeta.Id, nil
}

// VerifyInclusion retrieves an entry and returns the ImmuDB inclusion proof.
// This implements the /audit/verify/:txId endpoint logic.
func (c *Client) VerifyInclusion(ctx context.Context, key string) (map[string]interface{}, error) {
	entry, err := c.inner.VerifiedGet(ctx, []byte(key))
	if err != nil {
		return nil, fmt.Errorf("ImmuDB VerifiedGet failed: %w", err)
	}

	return map[string]interface{}{
		"key":      string(entry.Key),
		"value":    string(entry.Value),
		"txId":     entry.Tx,
		"revision": entry.Revision,
		"verified": true,
	}, nil
}

// Close terminates the ImmuDB session.
func (c *Client) Close() {
	if err := c.inner.CloseSession(context.Background()); err != nil {
		c.logger.Warn("ImmuDB CloseSession error", zap.Error(err))
	}
}
