import { IsString, IsNotEmpty, IsMongoId, IsIn, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMessageDto {
  @ApiProperty()
  @IsMongoId()
  @IsNotEmpty()
  conversationId: string;

  @ApiProperty({ enum: ['user', 'assistant'] })
  @IsString()
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  sources?: string[];
}
