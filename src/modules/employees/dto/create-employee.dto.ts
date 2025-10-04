import { IsString, IsEmail, IsNotEmpty, IsOptional, IsObject, IsArray, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'John Smith', description: 'Employee full name' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'john.smith@example.com', description: 'Employee email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123', description: 'Employee password' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Company ID' })
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({ example: 'engineering', description: 'Department' })
  @IsString()
  @IsNotEmpty()
  department: string;

  @ApiPropertyOptional({
    example: {
      roles: ['developer', 'team-lead'],
      skills: ['javascript', 'react'],
      interests: ['ai', 'web-development']
    },
    description: 'Employee tags'
  })
  @IsOptional()
  @IsObject()
  tags?: {
    roles?: string[];
    skills?: string[];
    interests?: string[];
  };
}

export class CreateEmployeeEmailDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Company ID' })
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({ example: 'employee@company.com', description: 'Corporate email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'GeneratedPass123!', description: 'Generated password' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}

