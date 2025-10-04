import { Injectable, NotFoundException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { DatabaseService } from '../../database/database.service';
import { Message } from './message.interface';
import { CreateMessageDto } from './dto/create-message.dto';
import { ConversationsService } from '../conversations/conversations.service';

@Injectable()
export class MessagesService {
  constructor(
    private readonly db: DatabaseService,
    private conversationsService: ConversationsService,
  ) {}

  async create(createMessageDto: CreateMessageDto): Promise<Message> {
    const conversationExists = await this.conversationsService.exists(createMessageDto.conversationId);
    if (!conversationExists) {
      throw new NotFoundException(`Conversation with ID ${createMessageDto.conversationId} not found`);
    }

    const message: Message = {
      conversationId: new ObjectId(createMessageDto.conversationId),
      role: createMessageDto.role,
      content: createMessageDto.content,
      sources: createMessageDto.sources,
      createdAt: new Date(),
    };

    const result = await this.db
      .getCollection<Message>('messages')
      .insertOne(message);

    return { ...message, _id: result.insertedId };
  }

  async findAllByConversation(conversationId: string): Promise<Message[]> {
    const conversationExists = await this.conversationsService.exists(conversationId);
    if (!conversationExists) {
      throw new NotFoundException(`Conversation with ID ${conversationId} not found`);
    }

    return this.db
      .getCollection<Message>('messages')
      .find({ conversationId: new ObjectId(conversationId) })
      .sort({ createdAt: 1 })
      .toArray();
  }

  async findOne(id: string): Promise<Message> {
    const message = await this.db
      .getCollection<Message>('messages')
      .findOne({ _id: new ObjectId(id) });

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }
    return message;
  }
}

