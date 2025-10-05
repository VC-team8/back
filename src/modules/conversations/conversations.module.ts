import { Module } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { CompaniesModule } from '../companies/companies.module';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [CompaniesModule, MessagesModule],
  controllers: [ConversationsController],
  providers: [ConversationsService],
  exports: [ConversationsService],
})
export class ConversationsModule {}

