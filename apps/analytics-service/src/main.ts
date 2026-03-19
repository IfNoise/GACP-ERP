import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
  );
  app.setGlobalPrefix('internal');
  app.enableVersioning();
  const port = process.env['PORT'] ?? 3006;
  await app.listen(port, '0.0.0.0');
  const logger = app.get('Logger', { strict: false });
  if (logger?.log) {
    logger.log(`AnalyticsService listening on port ${port}`, 'Bootstrap');
  } else {
    console.log(`[AnalyticsService] Listening on port ${port}`);
  }
}

bootstrap();
