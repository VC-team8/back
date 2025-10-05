import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { Conversation } from './conversation.interface';

@ApiTags('Conversations')
@Controller('conversations')
@UsePipes(new ValidationPipe({ transform: true }))
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiResponse({ status: 201, description: 'Conversation created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async create(@Body() createConversationDto: CreateConversationDto): Promise<Conversation> {
    return this.conversationsService.create(createConversationDto);
  }

  @Get('company/:companyId')
  @ApiOperation({ summary: 'Get conversations by company ID' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'List of conversations' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async findByCompany(@Param('companyId') companyId: string): Promise<Conversation[]> {
    return this.conversationsService.findAllByCompany(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get conversation by ID' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ status: 200, description: 'Conversation found' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async findOne(@Param('id') id: string): Promise<Conversation> {
    return this.conversationsService.findOne(id);
  }

}

