import { IsString, IsEmail, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiProperty({ description: 'Company name', example: 'Acme Inc.' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Company industry', example: 'technology' })
  @IsString()
  @IsNotEmpty()
  industry: string;

  @ApiProperty({ description: 'Company size', example: '51-200' })
  @IsString()
  @IsNotEmpty()
  size: string;

  @ApiProperty({ description: 'Contact person name', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  contactName: string;

  @ApiProperty({ description: 'Contact email', example: 'john@acme.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class UpdateCompanyDto {
  @ApiPropertyOptional({ description: 'Company name', example: 'Acme Inc.' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Company industry', example: 'technology' })
  @IsString()
  @IsOptional()
  industry?: string;

  @ApiPropertyOptional({ description: 'Company size', example: '51-200' })
  @IsString()
  @IsOptional()
  size?: string;

  @ApiPropertyOptional({ description: 'Contact person name', example: 'John Doe' })
  @IsString()
  @IsOptional()
  contactName?: string;

  @ApiPropertyOptional({ description: 'Contact email', example: 'john@acme.com' })
  @IsEmail()
  @IsOptional()
  email?: string;
}

