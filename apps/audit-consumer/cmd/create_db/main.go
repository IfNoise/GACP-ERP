package main

import (
	"context"
	"fmt"
	"os"

	immuclient "github.com/codenotary/immudb/pkg/client"
	schema "github.com/codenotary/immudb/pkg/api/schema"
)

func main() {
	host := getEnv("IMMUDB_HOST", "localhost")
	port := 3322
	username := getEnv("IMMUDB_USER", "immudb")
	password := getEnv("IMMUDB_PASSWORD", "Immudb@2026!")
	dbName := getEnv("IMMUDB_DATABASE", "gacp_audit")

	opts := immuclient.DefaultOptions().WithAddress(host).WithPort(port)
	client := immuclient.NewClient().WithOptions(opts)

	ctx := context.Background()

	// Login to defaultdb first as admin
	if err := client.OpenSession(ctx, []byte(username), []byte(password), "defaultdb"); err != nil {
		fmt.Fprintf(os.Stderr, "Failed to open session: %v\n", err)
		os.Exit(1)
	}
	defer client.CloseSession(ctx)

	// Create the target database
	_, err := client.CreateDatabaseV2(ctx, dbName, &schema.DatabaseNullableSettings{})
	if err != nil {
		fmt.Printf("Database '%s' might already exist or error: %v\n", dbName, err)
	} else {
		fmt.Printf("Database '%s' created successfully\n", dbName)
	}
}

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
