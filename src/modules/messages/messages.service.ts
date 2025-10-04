import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from './message.schema';
import { CreateMessageDto, UpdateMessageDto } from '../../common/dto/message.dto';
import { ConversationsService } from '../conversations/conversations.service';
import { ISource } from '../../common/interfaces/message.interface';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    private conversationsService: ConversationsService,
  ) {}

  async create(createMessageDto: CreateMessageDto): Promise<Message> {
    // Verify conversation exists
    const conversationExists = await this.conversationsService.exists(createMessageDto.conversationId);
    if (!conversationExists) {
      throw new NotFoundException(`Conversation with ID ${createMessageDto.conversationId} not found`);
    }

    const createdMessage = new this.messageModel(createMessageDto);
    return createdMessage.save();
  }

  async findAllByConversation(conversationId: string): Promise<Message[]> {
    // Verify conversation exists
    const conversationExists = await this.conversationsService.exists(conversationId);
    if (!conversationExists) {
      throw new NotFoundException(`Conversation with ID ${conversationId} not found`);
    }

    return this.messageModel.find({ conversationId }).sort({ createdAt: 1 }).exec();
  }

  async findOne(id: string): Promise<Message> {
    const message = await this.messageModel.findById(id).exec();
    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }
    return message;
  }

  async update(id: string, updateMessageDto: UpdateMessageDto): Promise<Message> {
    const updatedMessage = await this.messageModel
      .findByIdAndUpdate(id, updateMessageDto, { new: true })
      .exec();
    
    if (!updatedMessage) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }
    
    return updatedMessage;
  }

  async remove(id: string): Promise<void> {
    const result = await this.messageModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }
  }

  async sendMessage(conversationId: string, content: string): Promise<Message> {
    // Create user message
    const userMessage = await this.create({
      conversationId,
      role: 'user',
      content,
    });

    // Generate AI response (mock for now)
    const aiResponse = await this.generateAIResponse(content);

    // Create AI message
    const aiMessage = await this.create({
      conversationId,
      role: 'assistant',
      content: aiResponse.content,
      sources: aiResponse.sources,
    });

    return aiMessage;
  }

  private async generateAIResponse(userMessage: string): Promise<{ content: string; sources?: ISource[] }> {
    // Mock AI response - in production, this would integrate with OpenAI or another AI service
    const responses = [
      {
        content: `I understand you're asking about "${userMessage}". Based on the available resources, I can help you with that. This is a mock response in the development environment.`,
        sources: [
          {
            type: 'file' as const,
            title: 'Employee Handbook',
            excerpt: 'This is a sample excerpt from the employee handbook...',
          },
        ],
      },
      {
        content: `That's a great question about "${userMessage}". Let me check our resources for the most up-to-date information.`,
        sources: [
          {
            type: 'url' as const,
            title: 'Company Policies',
            url: 'https://example.com/policies',
            excerpt: 'Company policies and procedures...',
          },
        ],
      },
    ];

    // Return a random response for demo purposes
    return responses[Math.floor(Math.random() * responses.length)];
  }
}

