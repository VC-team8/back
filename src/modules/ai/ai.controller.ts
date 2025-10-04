import {
  Controller,
  Post,
  Body,
  Param,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AiService } from './ai.service';

@ApiTags('AI')
@Controller('ai')
@UsePipes(new ValidationPipe({ transform: true }))
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('process-file/:resourceId')
  @ApiOperation({ summary: 'Process a file resource for AI' })
  @ApiParam({ name: 'resourceId', description: 'Resource ID' })
  @ApiResponse({ status: 200, description: 'File processed successfully' })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  async processFile(@Param('resourceId') resourceId: string): Promise<{ message: string }> {
    await this.aiService.processFile(resourceId);
    return { message: 'File processed successfully' };
  }

  @Post('process-url/:resourceId')
  @ApiOperation({ summary: 'Process a URL resource for AI' })
  @ApiParam({ name: 'resourceId', description: 'Resource ID' })
  @ApiResponse({ status: 200, description: 'URL processed successfully' })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  async processUrl(@Param('resourceId') resourceId: string): Promise<{ message: string }> {
    await this.aiService.processUrl(resourceId);
    return { message: 'URL processed successfully' };
  }

  @Post('chat')
  @ApiOperation({ summary: 'Generate AI response' })
  @ApiResponse({ status: 200, description: 'AI response generated' })
  async generateResponse(
    @Body() body: { query: string; companyId: string },
  ): Promise<{ content: string; sources: any[] }> {
    return this.aiService.generateResponse(body.query, body.companyId);
  }

  @Post('status')
  @ApiOperation({ summary: 'Get AI service status' })
  @ApiResponse({ status: 200, description: 'AI service status' })
  async getStatus(): Promise<{ status: string; message: string }> {
    return this.aiService.getStatus();
  }
}

