import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto, CreateEmployeeEmailDto, LoginEmployeeDto, UpdateEmployeeDto } from './dto/create-employee.dto';
import { IEmployee, IEmployeeEmail } from './employee.interface';

@ApiTags('Employees')
@Controller('employees')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new employee' })
  @ApiResponse({ status: 201, description: 'Employee registered successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  @ApiResponse({ status: 409, description: 'Employee with this email already exists' })
  async create(
    @Body() createEmployeeDto: CreateEmployeeDto,
  ): Promise<Omit<IEmployee, 'password'> & { access_token: string }> {
    return this.employeesService.create(createEmployeeDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Employee login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() loginDto: LoginEmployeeDto,
  ): Promise<Omit<IEmployee, 'password'> & { access_token: string }> {
    return this.employeesService.login(loginDto);
  }

  @Post('create-email')
  @ApiOperation({ summary: 'Create corporate email for employee' })
  @ApiResponse({ status: 201, description: 'Email created successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async createEmail(
    @Body() createEmailDto: CreateEmployeeEmailDto,
  ): Promise<IEmployeeEmail> {
    return this.employeesService.createEmail(createEmailDto);
  }

  @Get('company/:companyId')
  @ApiOperation({ summary: 'Get all employees by company ID' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'List of employees' })
  async findByCompanyId(
    @Param('companyId') companyId: string,
  ): Promise<Omit<IEmployee, 'password'>[]> {
    return this.employeesService.findByCompanyId(companyId);
  }

  @Get('emails/company/:companyId')
  @ApiOperation({ summary: 'Get all employee emails by company ID' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'List of employee emails' })
  async findEmailsByCompanyId(
    @Param('companyId') companyId: string,
  ): Promise<IEmployeeEmail[]> {
    return this.employeesService.findEmailsByCompanyId(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee by ID' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiResponse({ status: 200, description: 'Employee found' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async findById(@Param('id') id: string): Promise<Omit<IEmployee, 'password'>> {
    return this.employeesService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update employee profile' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiResponse({ status: 200, description: 'Employee updated successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<Omit<IEmployee, 'password'>> {
    return this.employeesService.update(id, updateEmployeeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete employee' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiResponse({ status: 200, description: 'Employee deleted successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.employeesService.delete(id);
    return { message: 'Employee deleted successfully' };
  }

  @Delete('emails/:id')
  @ApiOperation({ summary: 'Delete employee email' })
  @ApiParam({ name: 'id', description: 'Email ID' })
  @ApiResponse({ status: 200, description: 'Email deleted successfully' })
  @ApiResponse({ status: 404, description: 'Email not found' })
  async deleteEmail(@Param('id') id: string): Promise<{ message: string }> {
    await this.employeesService.deleteEmail(id);
    return { message: 'Email deleted successfully' };
  }
}

