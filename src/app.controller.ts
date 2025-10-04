import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'API is healthy' })
  getHealth(): { status: string; timestamp: string } {
    return this.appService.getHealth();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get API statistics' })
  @ApiResponse({ status: 200, description: 'API statistics' })
  getStats(): Promise<any> {
    return this.appService.getStats();
  }
}

