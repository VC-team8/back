import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SourceDto {
  @ApiProperty({ description: 'Source type', enum: ['file', 'url'], example: 'file' })
  @IsEnum(['file', 'url'])
  type: 'file' | 'url';

  @ApiProperty({ description: 'Source title', example: 'Employee Handbook' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Source URL', example: 'https://example.com/handbook' })
  @IsString()
  @IsOptional()
  url?: string;

  @ApiPropertyOptional({ description: 'Source excerpt', example: 'This is an excerpt...' })
  @IsString()
  @IsOptional()
  excerpt?: string;
}

export class CreateMessageDto {
  @ApiProperty({ description: 'Conversation ID', example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @ApiProperty({ description: 'Message role', enum: ['user', 'assistant'], example: 'user' })
  @IsEnum(['user', 'assistant'])
  role: 'user' | 'assistant';

  @ApiProperty({ description: 'Message content', example: 'What are the company values?' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: 'Message sources', type: [SourceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SourceDto)
  @IsOptional()
  sources?: SourceDto[];
}

export class UpdateMessageDto {
  @ApiPropertyOptional({ description: 'Message content', example: 'Updated message content' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ description: 'Message sources', type: [SourceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SourceDto)
  @IsOptional()
  sources?: SourceDto[];
}

export class SendMessageDto {
  @ApiProperty({ description: 'Message content', example: 'What are the company values?' })
  @IsString()
  @IsNotEmpty()
  content: string;
}

