package http

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gacp-erp/audit-consumer/internal/immudb"
	"go.uber.org/zap"
)

// Server exposes the HTTP API for the audit consumer.
type Server struct {
	srv    *http.Server
	immu   *immudb.Client
	logger *zap.Logger
}

// New creates a new HTTP Server bound to addr (e.g. ":8081").
func New(addr string, immuClient *immudb.Client, logger *zap.Logger) *Server {
	s := &Server{immu: immuClient, logger: logger}

	mux := http.NewServeMux()
	mux.HandleFunc("/health", s.handleHealth)
	mux.HandleFunc("/audit/verify/", s.handleVerify)

	s.srv = &http.Server{
		Addr:         addr,
		Handler:      mux,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}
	return s
}

// Start begins serving in the background. Returns immediately.
func (s *Server) Start() {
	go func() {
		s.logger.Info("HTTP server listening", zap.String("addr", s.srv.Addr))
		if err := s.srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			s.logger.Error("HTTP server error", zap.Error(err))
		}
	}()
}

// Shutdown gracefully stops the HTTP server.
func (s *Server) Shutdown(ctx context.Context) {
	if err := s.srv.Shutdown(ctx); err != nil {
		s.logger.Warn("HTTP server shutdown error", zap.Error(err))
	}
}

// handleHealth returns 200 OK — used by Docker healthchecks.
func (s *Server) handleHealth(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(`{"status":"ok"}`))
}

// handleVerify implements GET /audit/verify/:key
// The ":key" segment is an audit record key in the form "audit:<eventType>:<eventId>".
// Example: GET /audit/verify/audit:PLANT_CREATED:550e8400-e29b-41d4-a716-446655440000
func (s *Server) handleVerify(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract key from path: /audit/verify/<key>
	key := strings.TrimPrefix(r.URL.Path, "/audit/verify/")
	key = strings.TrimSpace(key)
	if key == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "audit key is required: /audit/verify/<eventType>:<eventId>",
		})
		return
	}

	result, err := s.immu.VerifyInclusion(r.Context(), key)
	if err != nil {
		s.logger.Warn("VerifyInclusion failed",
			zap.String("key", key),
			zap.Error(err),
		)
		writeJSON(w, http.StatusNotFound, map[string]string{
			"error":    fmt.Sprintf("audit record not found or verification failed: %s", err.Error()),
			"key":      key,
			"verified": "false",
		})
		return
	}

	writeJSON(w, http.StatusOK, result)
}

func writeJSON(w http.ResponseWriter, status int, body interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(body); err != nil {
		// Best-effort — response headers already sent
		_ = err
	}
}
