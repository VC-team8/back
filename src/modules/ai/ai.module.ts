import { Module, forwardRef } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { ResourcesModule } from '../resources/resources.module';

@Module({
  imports: [forwardRef(() => ResourcesModule)],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}

