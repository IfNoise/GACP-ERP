import { NodeSDK, resources, metrics, tracing } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from '@opentelemetry/semantic-conventions';

export interface TelemetryOptions {
  serviceName: string;
  serviceVersion?: string;
  environment?: string;
  /** OTLP endpoint (default: http://localhost:4317) */
  otlpEndpoint?: string;
  /** Disable telemetry entirely (useful for tests) */
  enabled?: boolean;
}

let sdk: NodeSDK | undefined;

/**
 * Initialize OpenTelemetry SDK.
 * MUST be called BEFORE NestJS bootstrap to ensure all auto-instrumentation
 * hooks are registered before any HTTP/DB/Kafka imports.
 */
export function initTelemetry(options: TelemetryOptions): void {
  const enabled = options.enabled ?? process.env['OTEL_ENABLED'] !== 'false';
  if (!enabled) return;

  const endpoint =
    options.otlpEndpoint ?? process.env['OTEL_EXPORTER_OTLP_ENDPOINT'] ?? 'http://localhost:4317';

  const resource = resources.resourceFromAttributes({
    [ATTR_SERVICE_NAME]: options.serviceName,
    [ATTR_SERVICE_VERSION]: options.serviceVersion ?? '1.0.0',
    [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]:
      options.environment ?? process.env['NODE_ENV'] ?? 'development',
  });

  const traceExporter = new OTLPTraceExporter({ url: endpoint });
  const metricExporter = new OTLPMetricExporter({ url: endpoint });

  sdk = new NodeSDK({
    resource,
    spanProcessors: [new tracing.BatchSpanProcessor(traceExporter)],
    metricReader: new metrics.PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: 30_000,
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
        '@opentelemetry/instrumentation-dns': { enabled: false },
      }),
    ],
  });

  sdk.start();
}

/** Gracefully shut down the OTel SDK (call in onApplicationShutdown). */
export async function shutdownTelemetry(): Promise<void> {
  if (sdk) {
    await sdk.shutdown();
  }
}
