import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }

  async getStats(): Promise<any> {
    // TODO: Implement statistics collection
    return {
      message: 'Statistics endpoint - to be implemented',
      timestamp: new Date().toISOString(),
    };
  }
}

