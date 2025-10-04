import { IsString, IsEmail, IsNotEmpty, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Tech Corp' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Technology' })
  @IsString()
  @IsNotEmpty()
  industry: string;

  @ApiProperty({ example: '50-100' })
  @IsString()
  @IsNotEmpty()
  size: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  contactName: string;

  @ApiProperty({ example: 'john@techcorp.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;
}
