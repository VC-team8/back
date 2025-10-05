import { Module, forwardRef } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { ResourcesModule } from '../resources/resources.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [forwardRef(() => ResourcesModule), CacheModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}

