import { Module, forwardRef } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { ResourcesController } from './resources.controller';
import { CompaniesModule } from '../companies/companies.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [CompaniesModule, forwardRef(() => AiModule)],
  controllers: [ResourcesController],
  providers: [ResourcesService],
  exports: [ResourcesService],
})
export class ResourcesModule {}

