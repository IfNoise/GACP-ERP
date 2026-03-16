package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

// Config holds all runtime configuration loaded from environment variables.
type Config struct {
	Kafka  KafkaConfig
	ImmuDB ImmuDBConfig
	App    AppConfig
}

// KafkaConfig — Kafka consumer settings.
type KafkaConfig struct {
	Brokers []string
	GroupID string
	Topics  []string
}

// ImmuDBConfig — ImmuDB connection settings.
type ImmuDBConfig struct {
	Host     string
	Port     int
	Username string
	Password string
	Database string
}

// AppConfig — general application settings.
type AppConfig struct {
	LogLevel string
	Env      string
	HTTPPort string
}

// Load reads configuration from environment variables.
// An optional .env file in the working directory is loaded if present.
func Load() (*Config, error) {
	// Best-effort .env load — ignore error if file absent
	_ = godotenv.Load("../../docker/.env")
	_ = godotenv.Load(".env")

	immuPort, err := strconv.Atoi(getEnv("IMMUDB_PORT", "3322"))
	if err != nil {
		return nil, fmt.Errorf("invalid IMMUDB_PORT: %w", err)
	}

		brokersRaw := getEnv("KAFKA_BROKERS", "localhost:9094")
	topicsRaw := getEnv(
		"AUDIT_CONSUMER_TOPICS",
		"audit.trail.v1,cultivation.plants.v1",
	)

	return &Config{
		Kafka: KafkaConfig{
			Brokers: strings.Split(brokersRaw, ","),
			GroupID: getEnv("AUDIT_CONSUMER_GROUP_ID", "gacp-audit-consumer"),
			Topics:  strings.Split(topicsRaw, ","),
		},
		ImmuDB: ImmuDBConfig{
			Host:     getEnv("IMMUDB_HOST", "localhost"),
			Port:     immuPort,
			Username: getEnv("IMMUDB_USERNAME", "immudb"),
			Password: getEnv("IMMUDB_PASSWORD", "immudb"),
			Database: getEnv("IMMUDB_DATABASE", "defaultdb"),
		},
		App: AppConfig{
			LogLevel: getEnv("LOG_LEVEL", "info"),
			Env:      getEnv("NODE_ENV", "development"),
			HTTPPort: getEnv("AUDIT_CONSUMER_HTTP_PORT", "8081"),
		},
	}, nil
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
