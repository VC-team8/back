import { IsString, IsNotEmpty, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadResourceDto {
  @ApiProperty()
  @IsMongoId()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;
}

export class AddUrlResourceDto {
  @ApiProperty()
  @IsMongoId()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  url: string;
}
