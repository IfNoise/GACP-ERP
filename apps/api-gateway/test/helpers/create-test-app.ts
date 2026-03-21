import { Test, type TestingModuleBuilder } from '@nestjs/testing';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { VersioningType } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import { KafkaProducerService } from '../../src/kafka/kafka-producer.service';
import { KAFKA_CLIENT } from '../../src/kafka/kafka-tokens';
import { ZodValidationPipe } from '../../src/common/pipes/zod-validation.pipe';
import { AllExceptionsFilter } from '../../src/common/filters/all-exceptions.filter';
import { MockJwtAuthGuard } from './mock-jwt';

export interface MockKafkaProducer {
  publish: jest.Mock;
  onModuleInit: jest.Mock;
  onModuleDestroy: jest.Mock;
  events: Array<{ topic: string; key: string; value: unknown }>;
  clear(): void;
}

export function createMockKafkaProducer(): MockKafkaProducer {
  const events: Array<{ topic: string; key: string; value: unknown }> = [];
  const publish = jest.fn((topic: string, key: string, value: unknown) => {
    events.push({ topic, key, value });
  });
  return {
    publish,
    onModuleInit: jest.fn().mockResolvedValue(undefined),
    onModuleDestroy: jest.fn().mockResolvedValue(undefined),
    events,
    clear() {
      events.length = 0;
      publish.mockClear();
    },
  };
}

export interface TestContext {
  app: NestFastifyApplication;
  mockKafka: MockKafkaProducer;
}

/**
 * Creates an E2E test NestJS application with mocked external deps:
 * - JwtAuthGuard → MockJwtAuthGuard (reads x-test-user header)
 * - KafkaProducerService → mock (records events)
 * - KAFKA_CLIENT → mock (no real broker connection)
 *
 * The `configure` callback allows additional overrides (e.g. mock AuthService).
 */
export async function createTestApp(
  configure?: (builder: TestingModuleBuilder) => TestingModuleBuilder,
): Promise<TestContext> {
  const mockKafka = createMockKafkaProducer();

  // Env vars required by ConfigService / JwtStrategy constructor
  process.env['DATABASE_URL'] ??=
    'postgresql://gacp_test:gacp_test_pass@localhost:5433/gacp_erp_test';
  process.env['KEYCLOAK_JWKS_URI'] ??=
    'http://localhost:8080/realms/gacp/protocol/openid-connect/certs';
  process.env['KEYCLOAK_ISSUER'] ??= 'http://localhost:8080/realms/gacp';
  process.env['KEYCLOAK_CLIENT_ID'] ??= 'api-gateway';
  process.env['KEYCLOAK_CLIENT_SECRET'] ??= 'test-secret';
  process.env['KEYCLOAK_URL'] ??= 'http://localhost:8080';
  process.env['KEYCLOAK_REALM'] ??= 'gacp';

  let builder = Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideGuard(JwtAuthGuard)
    .useClass(MockJwtAuthGuard)
    .overrideProvider(KafkaProducerService)
    .useValue(mockKafka)
    .overrideProvider(KAFKA_CLIENT)
    .useValue({
      connect: jest.fn(),
      close: jest.fn(),
      emit: jest.fn().mockReturnValue({ subscribe: jest.fn() }),
    });

  if (configure) {
    builder = configure(builder);
  }

  const moduleRef = await builder.compile();

  const app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  return { app, mockKafka };
}
