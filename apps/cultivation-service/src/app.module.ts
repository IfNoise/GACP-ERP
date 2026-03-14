import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PlantsModule } from './plants/plants.module';
import { BatchesModule } from './batches/batches.module';
import { QrModule } from './qr/qr.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../docker/.env', '../../docker/.env.example'],
    }),
    DatabaseModule,
    PlantsModule,
    BatchesModule,
    QrModule,
  ],
})
export class AppModule {}
