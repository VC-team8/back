import { IsString, IsNotEmpty, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConversationDto {
  @ApiProperty()
  @IsMongoId()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;
}
