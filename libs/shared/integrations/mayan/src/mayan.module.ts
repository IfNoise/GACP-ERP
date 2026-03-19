import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MayanClient } from './mayan.client';
import { MayanDocumentService } from './mayan-document.service';

@Module({
  imports: [ConfigModule],
  providers: [MayanClient, MayanDocumentService],
  exports: [MayanDocumentService],
})
export class MayanModule {}
