import { Injectable, NotFoundException, ConflictException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { DatabaseService } from '../../database/database.service';
import { CreateEmployeeDto, CreateEmployeeEmailDto, LoginEmployeeDto, UpdateEmployeeDto } from './dto/create-employee.dto';
import { IEmployee, IEmployeeEmail } from './employee.interface';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmployeesService {
  constructor(private readonly db: DatabaseService) {
    // Create indexes on initialization
    this.createIndexes();
  }

  private async createIndexes() {
    try {
      await this.db.getCollection<IEmployee>('employees').createIndex({ email: 1 }, { unique: true });
      await this.db.getCollection<IEmployee>('employees').createIndex({ companyId: 1 });
      await this.db.getCollection<IEmployeeEmail>('employee_emails').createIndex({ email: 1 }, { unique: true });
      await this.db.getCollection<IEmployeeEmail>('employee_emails').createIndex({ companyId: 1 });
    } catch (error) {
      // Indexes might already exist, ignore error
    }
  }

  async create(createEmployeeDto: CreateEmployeeDto): Promise<any> {
    // Validate companyId format
    if (!ObjectId.isValid(createEmployeeDto.companyId)) {
      throw new BadRequestException('Invalid company ID format');
    }

    // Check if company exists
    const company = await this.db
      .getCollection('companies')
      .findOne({ _id: new ObjectId(createEmployeeDto.companyId) });
    
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Check if email already exists
    const existingEmployee = await this.db
      .getCollection<IEmployee>('employees')
      .findOne({ email: createEmployeeDto.email });
    
    if (existingEmployee) {
      throw new ConflictException('Employee with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createEmployeeDto.password, 10);

    // Create employee
    const employee: IEmployee = {
      ...createEmployeeDto,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await this.db
      .getCollection<IEmployee>('employees')
      .insertOne(employee as any);

    const createdEmployee = await this.db
      .getCollection<IEmployee>('employees')
      .findOne({ _id: result.insertedId });

    // Generate mock access token (in real app, use JWT)
    const access_token = `mock_token_${result.insertedId}`;

    // Remove password from response and add id field
    const { password, ...employeeWithoutPassword } = createdEmployee as any;

    return {
      ...employeeWithoutPassword,
      id: result.insertedId.toString(),
      _id: result.insertedId.toString(),
      access_token,
    };
  }

  async login(loginDto: LoginEmployeeDto): Promise<any> {
    // Find employee by email
    const employee = await this.db
      .getCollection<IEmployee>('employees')
      .findOne({ email: loginDto.email });

    if (!employee) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginDto.password, employee.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate mock access token (in real app, use JWT)
    const access_token = `mock_token_${employee._id}`;

    // Remove password from response and add id field
    const { password, ...employeeWithoutPassword } = employee as any;

    return {
      ...employeeWithoutPassword,
      id: employee._id.toString(),
      _id: employee._id.toString(),
      companyId: employee.companyId,
      access_token,
    };
  }

  async createEmail(createEmailDto: CreateEmployeeEmailDto): Promise<any> {
    // Validate companyId format
    if (!ObjectId.isValid(createEmailDto.companyId)) {
      throw new BadRequestException('Invalid company ID format');
    }

    // Check if company exists
    const company = await this.db
      .getCollection('companies')
      .findOne({ _id: new ObjectId(createEmailDto.companyId) });
    
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Check if email already exists
    const existingEmail = await this.db
      .getCollection<IEmployeeEmail>('employee_emails')
      .findOne({ email: createEmailDto.email });
    
    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    const employeeEmail: IEmployeeEmail = {
      ...createEmailDto,
      createdAt: new Date(),
    };

    const result = await this.db
      .getCollection<IEmployeeEmail>('employee_emails')
      .insertOne(employeeEmail as any);

    const createdEmail = await this.db
      .getCollection<IEmployeeEmail>('employee_emails')
      .findOne({ _id: result.insertedId });

    // Return with id field for frontend compatibility
    return {
      ...createdEmail,
      id: result.insertedId.toString(),
      _id: result.insertedId.toString(),
    };
  }

  async findByCompanyId(companyId: string): Promise<any[]> {
    const employees = await this.db
      .getCollection<IEmployee>('employees')
      .find({ companyId })
      .project({ password: 0 })
      .toArray();

    return employees.map(emp => ({
      ...emp,
      id: emp._id.toString(),
      _id: emp._id.toString(),
    }));
  }

  async findEmailsByCompanyId(companyId: string): Promise<any[]> {
    const emails = await this.db
      .getCollection<IEmployeeEmail>('employee_emails')
      .find({ companyId })
      .toArray();

    return emails.map(email => ({
      ...email,
      id: email._id.toString(),
      _id: email._id.toString(),
    }));
  }

  async findById(id: string): Promise<any> {
    const employee = await this.db
      .getCollection<IEmployee>('employees')
      .findOne(
        { _id: new ObjectId(id) } as any,
        { projection: { password: 0 } }
      );

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return {
      ...employee,
      id: employee._id.toString(),
      _id: employee._id.toString(),
    };
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto): Promise<any> {
    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid employee ID format');
    }

    const updateData: any = {
      ...updateEmployeeDto,
      updatedAt: new Date(),
    };

    const result = await this.db
      .getCollection<IEmployee>('employees')
      .findOneAndUpdate(
        { _id: new ObjectId(id) } as any,
        { $set: updateData },
        { returnDocument: 'after', projection: { password: 0 } }
      );

    if (!result) {
      throw new NotFoundException('Employee not found');
    }

    return {
      ...result,
      id: result._id.toString(),
      _id: result._id.toString(),
    };
  }

  async delete(id: string): Promise<void> {
    const result = await this.db
      .getCollection<IEmployee>('employees')
      .deleteOne({ _id: new ObjectId(id) } as any);

    if (result.deletedCount === 0) {
      throw new NotFoundException('Employee not found');
    }
  }

  async deleteEmail(id: string): Promise<void> {
    const result = await this.db
      .getCollection<IEmployeeEmail>('employee_emails')
      .deleteOne({ _id: new ObjectId(id) } as any);

    if (result.deletedCount === 0) {
      throw new NotFoundException('Employee email not found');
    }
  }
}

