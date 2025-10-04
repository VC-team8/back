import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConversationDto {
  @ApiProperty({ description: 'Company ID', example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @ApiPropertyOptional({ description: 'Conversation title', example: 'Onboarding Questions' })
  @IsString()
  @IsOptional()
  title?: string;
}

export class UpdateConversationDto {
  @ApiPropertyOptional({ description: 'Conversation title', example: 'Onboarding Questions' })
  @IsString()
  @IsOptional()
  title?: string;
}

