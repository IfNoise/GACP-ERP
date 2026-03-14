package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"

	"github.com/gacp-erp/audit-consumer/internal/config"
	"github.com/gacp-erp/audit-consumer/internal/immudb"
	kafkaconsumer "github.com/gacp-erp/audit-consumer/internal/kafka"
	"go.uber.org/zap"
)

func main() {
	// ── Logger ───────────────────────────────────────────────────────────────
	logger, err := zap.NewProduction()
	if err != nil {
		panic("failed to initialise zap logger: " + err.Error())
	}
	defer func() { _ = logger.Sync() }()

	logger.Info("Starting GACP-ERP Audit Consumer",
		zap.String("version", "1.0.0"),
	)

	// ── Config ───────────────────────────────────────────────────────────────
	cfg, err := config.Load()
	if err != nil {
		logger.Fatal("Failed to load configuration", zap.Error(err))
	}

	// ── ImmuDB client ────────────────────────────────────────────────────────
	immuClient, err := immudb.NewClient(immudb.Config{
		Host:     cfg.ImmuDB.Host,
		Port:     cfg.ImmuDB.Port,
		Username: cfg.ImmuDB.Username,
		Password: cfg.ImmuDB.Password,
		Database: cfg.ImmuDB.Database,
		Logger:   logger,
	})
	if err != nil {
		logger.Fatal("Failed to connect to ImmuDB", zap.Error(err))
	}
	defer immuClient.Close()

	logger.Info("Connected to ImmuDB",
		zap.String("host", cfg.ImmuDB.Host),
		zap.Int("port", cfg.ImmuDB.Port),
	)

	// ── Kafka consumer ───────────────────────────────────────────────────────
	consumer := kafkaconsumer.New(kafkaconsumer.Config{
		Brokers:    cfg.Kafka.Brokers,
		GroupID:    cfg.Kafka.GroupID,
		Topics:     cfg.Kafka.Topics,
		ImmuClient: immuClient,
		Logger:     logger,
	})

	// ── Graceful shutdown ────────────────────────────────────────────────────
	ctx, cancel := context.WithCancel(context.Background())

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		sig := <-sigChan
		logger.Info("Received shutdown signal", zap.String("signal", sig.String()))
		cancel()
	}()

	// ── Run ──────────────────────────────────────────────────────────────────
	logger.Info("Kafka consumer started",
		zap.Strings("topics", cfg.Kafka.Topics),
		zap.String("groupId", cfg.Kafka.GroupID),
	)

	if err := consumer.Run(ctx); err != nil {
		logger.Error("Consumer exited with error", zap.Error(err))
		os.Exit(1)
	}

	logger.Info("Audit consumer shut down cleanly")
}
