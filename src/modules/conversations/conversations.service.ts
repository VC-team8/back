import { Injectable, NotFoundException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { DatabaseService } from '../../database/database.service';
import { Conversation } from './conversation.interface';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CompaniesService } from '../companies/companies.service';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly db: DatabaseService,
    private companiesService: CompaniesService,
  ) {}

  async create(createConversationDto: CreateConversationDto): Promise<any> {
    const companyExists = await this.companiesService.exists(createConversationDto.companyId);
    if (!companyExists) {
      throw new NotFoundException(`Company with ID ${createConversationDto.companyId} not found`);
    }

    const conversation: Conversation = {
      companyId: new ObjectId(createConversationDto.companyId),
      title: createConversationDto.title,
      createdAt: new Date(),
    };

    const result = await this.db
      .getCollection<Conversation>('conversations')
      .insertOne(conversation);

    return {
      ...conversation,
      id: result.insertedId.toString(),
      _id: result.insertedId.toString(),
      companyId: createConversationDto.companyId,
    };
  }

  async findAllByCompany(companyId: string): Promise<any[]> {
    const companyExists = await this.companiesService.exists(companyId);
    if (!companyExists) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    const conversations = await this.db
      .getCollection<Conversation>('conversations')
      .find({ companyId: new ObjectId(companyId) })
      .sort({ createdAt: -1 })
      .toArray();

    return conversations.map(conv => ({
      ...conv,
      id: conv._id.toString(),
      _id: conv._id.toString(),
      companyId: companyId,
    }));
  }

  async findOne(id: string): Promise<any> {
    const conversation = await this.db
      .getCollection<Conversation>('conversations')
      .findOne({ _id: new ObjectId(id) });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    return {
      ...conversation,
      id: conversation._id.toString(),
      _id: conversation._id.toString(),
      companyId: conversation.companyId.toString(),
    };
  }

  async exists(id: string): Promise<boolean> {
    const conversation = await this.db
      .getCollection<Conversation>('conversations')
      .findOne({ _id: new ObjectId(id) });
    return !!conversation;
  }
}

