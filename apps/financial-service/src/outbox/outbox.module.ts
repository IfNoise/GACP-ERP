import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { OutboxRepository } from './outbox.repository';
import { OutboxRelayService } from './outbox-relay.service';
import { KafkaProducerModule } from '../kafka/kafka-producer.module';

@Module({
  imports: [ScheduleModule.forRoot(), KafkaProducerModule],
  providers: [OutboxRepository, OutboxRelayService],
  exports: [OutboxRepository],
})
export class OutboxModule {}
