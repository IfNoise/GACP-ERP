FROM golang:1.21-alpine AS builder

WORKDIR /app

COPY go.mod go.sum* ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o audit-consumer .

# ── Run stage ─────────────────────────────────────────────────────────────────
FROM scratch

COPY --from=builder /app/audit-consumer /audit-consumer
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

EXPOSE 8080

ENTRYPOINT ["/audit-consumer"]
