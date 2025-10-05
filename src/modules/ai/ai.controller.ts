import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Query,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { CacheService } from '../cache/cache.service';

@ApiTags('AI')
@Controller('ai')
@UsePipes(new ValidationPipe({ transform: true }))
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly cacheService: CacheService,
  ) {}

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

  @Get('popular-questions/:companyId')
  @ApiOperation({ summary: 'Get most popular questions for a company' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of questions to return (default: 10)' })
  @ApiResponse({ status: 200, description: 'List of popular questions' })
  async getPopularQuestions(
    @Param('companyId') companyId: string,
    @Query('limit') limit?: number,
  ): Promise<any[]> {
    const parsedLimit = limit ? parseInt(limit.toString(), 10) : 10;
    return this.cacheService.getPopularQuestions(companyId, parsedLimit);
  }

  @Get('cache-stats/:companyId')
  @ApiOperation({ summary: 'Get cache statistics for a company' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Cache statistics' })
  async getCacheStats(@Param('companyId') companyId: string): Promise<any> {
    return this.cacheService.getCacheStats(companyId);
  }

  @Post('cache/clear/:companyId')
  @ApiOperation({ summary: 'Clear cache for a company' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Cache cleared successfully' })
  async clearCache(@Param('companyId') companyId: string): Promise<{ message: string }> {
    await this.cacheService.clearCompanyCache(companyId);
    return { message: 'Cache cleared successfully' };
  }
}

