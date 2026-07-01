import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { KafkaProducerModule } from '../kafka/kafka-producer.module';
import { OutboxRepository } from './outbox.repository';
import { OutboxRelayService } from './outbox-relay.service';

@Module({
  imports: [ScheduleModule.forRoot(), KafkaProducerModule],
  providers: [OutboxRepository, OutboxRelayService],
  exports: [OutboxRepository],
})
export class OutboxModule {}
