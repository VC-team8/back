import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { Company } from './company.interface';

@ApiTags('Companies')
@Controller('companies')
@UsePipes(new ValidationPipe({ transform: true }))
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new company' })
  @ApiResponse({ status: 201, description: 'Company created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async create(@Body() createCompanyDto: CreateCompanyDto): Promise<Company> {
    return this.companiesService.create(createCompanyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all companies' })
  @ApiResponse({ status: 200, description: 'List of companies' })
  async findAll(): Promise<Company[]> {
    return this.companiesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get company by ID' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Company found' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async findOne(@Param('id') id: string): Promise<Company> {
    return this.companiesService.findOne(id);
  }

  @Get(':id/resources')
  @ApiOperation({ summary: 'Get company resources' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Company resources' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async getResources(@Param('id') id: string) {
    // This will be handled by the resources controller
    return { message: 'Use /api/companies/:id/resources endpoint' };
  }

  @Get(':id/conversations')
  @ApiOperation({ summary: 'Get company conversations' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Company conversations' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async getConversations(@Param('id') id: string) {
    // This will be handled by the conversations controller
    return { message: 'Use /api/companies/:id/conversations endpoint' };
  }
}

