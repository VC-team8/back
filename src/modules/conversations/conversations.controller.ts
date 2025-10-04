import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto, UpdateConversationDto } from '../../common/dto/conversation.dto';
import { Conversation } from './conversation.schema';

@ApiTags('Conversations')
@Controller('conversations')
@UsePipes(new ValidationPipe({ transform: true }))
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiResponse({ status: 201, description: 'Conversation created successfully', type: Conversation })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async create(@Body() createConversationDto: CreateConversationDto): Promise<Conversation> {
    return this.conversationsService.create(createConversationDto);
  }

  @Get('companies/:companyId')
  @ApiOperation({ summary: 'Get conversations by company ID' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'List of conversations', type: [Conversation] })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async findByCompany(@Param('companyId') companyId: string): Promise<Conversation[]> {
    return this.conversationsService.findAllByCompany(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get conversation by ID' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ status: 200, description: 'Conversation found', type: Conversation })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async findOne(@Param('id') id: string): Promise<Conversation> {
    return this.conversationsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ status: 200, description: 'Conversation updated successfully', type: Conversation })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async update(
    @Param('id') id: string,
    @Body() updateConversationDto: UpdateConversationDto,
  ): Promise<Conversation> {
    return this.conversationsService.update(id, updateConversationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ status: 200, description: 'Conversation deleted successfully' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.conversationsService.remove(id);
    return { message: 'Conversation deleted successfully' };
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get messages by conversation ID' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ status: 200, description: 'List of messages' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async getMessages(@Param('id') id: string) {
    // This will be handled by the messages controller
    return { message: 'Use /api/conversations/:id/messages endpoint' };
  }
}

