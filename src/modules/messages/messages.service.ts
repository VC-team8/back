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

  async create(createMessageDto: CreateMessageDto): Promise<any> {
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

    return {
      ...message,
      id: result.insertedId.toString(),
      _id: result.insertedId.toString(),
      conversationId: createMessageDto.conversationId,
    };
  }

  async findAllByConversation(conversationId: string): Promise<any[]> {
    const conversationExists = await this.conversationsService.exists(conversationId);
    if (!conversationExists) {
      throw new NotFoundException(`Conversation with ID ${conversationId} not found`);
    }

    const messages = await this.db
      .getCollection<Message>('messages')
      .find({ conversationId: new ObjectId(conversationId) })
      .sort({ createdAt: 1 })
      .toArray();

    return messages.map(msg => ({
      ...msg,
      id: msg._id.toString(),
      _id: msg._id.toString(),
      conversationId: conversationId,
    }));
  }

  async findOne(id: string): Promise<any> {
    const message = await this.db
      .getCollection<Message>('messages')
      .findOne({ _id: new ObjectId(id) });

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    return {
      ...message,
      id: message._id.toString(),
      _id: message._id.toString(),
      conversationId: message.conversationId.toString(),
    };
  }
}

