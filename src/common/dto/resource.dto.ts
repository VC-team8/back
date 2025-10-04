import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateResourceDto {
  @ApiProperty({ description: 'Company ID', example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({ description: 'Resource type', enum: ['file', 'url'], example: 'file' })
  @IsString()
  @IsNotEmpty()
  type: 'file' | 'url';

  @ApiProperty({ description: 'Resource title', example: 'Employee Handbook' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Resource URL', example: 'https://example.com/handbook' })
  @IsString()
  @IsOptional()
  url?: string;

  @ApiPropertyOptional({ description: 'File URL', example: 'https://storage.example.com/file.pdf' })
  @IsString()
  @IsOptional()
  fileUrl?: string;

  @ApiPropertyOptional({ description: 'File path', example: '/uploads/files/handbook.pdf' })
  @IsString()
  @IsOptional()
  filePath?: string;

  @ApiPropertyOptional({ description: 'File size in bytes', example: 1024000 })
  @IsNumber()
  @IsOptional()
  fileSize?: number;

  @ApiPropertyOptional({ description: 'MIME type', example: 'application/pdf' })
  @IsString()
  @IsOptional()
  mimeType?: string;

  @ApiPropertyOptional({ description: 'Whether resource is processed', example: false })
  @IsBoolean()
  @IsOptional()
  processed?: boolean;
}

export class UpdateResourceDto {
  @ApiPropertyOptional({ description: 'Resource title', example: 'Employee Handbook' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Resource URL', example: 'https://example.com/handbook' })
  @IsString()
  @IsOptional()
  url?: string;

  @ApiPropertyOptional({ description: 'Whether resource is processed', example: true })
  @IsBoolean()
  @IsOptional()
  processed?: boolean;
}

export class AddUrlResourceDto {
  @ApiProperty({ description: 'Company ID', example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({ description: 'Resource URL', example: 'https://example.com/handbook' })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiPropertyOptional({ description: 'Resource title', example: 'Employee Handbook' })
  @IsString()
  @IsOptional()
  title?: string;
}

