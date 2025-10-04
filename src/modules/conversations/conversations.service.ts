import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Conversation, ConversationDocument } from './conversation.schema';
import { CreateConversationDto, UpdateConversationDto } from '../../common/dto/conversation.dto';
import { CompaniesService } from '../companies/companies.service';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
    private companiesService: CompaniesService,
  ) {}

  async create(createConversationDto: CreateConversationDto): Promise<Conversation> {
    // Verify company exists
    const companyExists = await this.companiesService.exists(createConversationDto.companyId);
    if (!companyExists) {
      throw new NotFoundException(`Company with ID ${createConversationDto.companyId} not found`);
    }

    const createdConversation = new this.conversationModel(createConversationDto);
    return createdConversation.save();
  }

  async findAllByCompany(companyId: string): Promise<Conversation[]> {
    // Verify company exists
    const companyExists = await this.companiesService.exists(companyId);
    if (!companyExists) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    return this.conversationModel.find({ companyId }).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Conversation> {
    const conversation = await this.conversationModel.findById(id).exec();
    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }
    return conversation;
  }

  async update(id: string, updateConversationDto: UpdateConversationDto): Promise<Conversation> {
    const updatedConversation = await this.conversationModel
      .findByIdAndUpdate(id, updateConversationDto, { new: true })
      .exec();
    
    if (!updatedConversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }
    
    return updatedConversation;
  }

  async remove(id: string): Promise<void> {
    const result = await this.conversationModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }
  }

  async exists(id: string): Promise<boolean> {
    const conversation = await this.conversationModel.findById(id).exec();
    return !!conversation;
  }
}

