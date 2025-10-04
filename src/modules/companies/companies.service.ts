import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { DatabaseService } from '../../database/database.service';
import { Company } from './company.interface';
import { CreateCompanyDto, LoginCompanyDto } from './dto/create-company.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CompaniesService {
  constructor(private readonly db: DatabaseService) {}

  async login(loginDto: LoginCompanyDto): Promise<any> {
    // Find company by email
    const company = await this.db
      .getCollection<Company>('companies')
      .findOne({ email: loginDto.email });

    if (!company) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verify password
    if (!company.password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, company.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Remove password from response and add id field
    const { password, ...companyWithoutPassword } = company as any;

    return {
      ...companyWithoutPassword,
      id: company._id.toString(),
      _id: company._id.toString(),
    };
  }

  async create(createCompanyDto: CreateCompanyDto): Promise<any> {
    const hashedPassword = createCompanyDto.password
      ? await bcrypt.hash(createCompanyDto.password, 10)
      : undefined;

    const company: Company = {
      ...createCompanyDto,
      password: hashedPassword,
      createdAt: new Date(),
    };

    const result = await this.db
      .getCollection<Company>('companies')
      .insertOne(company);

    // Return with both _id and id for frontend compatibility
    const { password, ...companyWithoutPassword } = { ...company, _id: result.insertedId };
    return {
      ...companyWithoutPassword,
      id: result.insertedId.toString(),
      _id: result.insertedId.toString(),
    };
  }

  async findAll(): Promise<Company[]> {
    return this.db.getCollection<Company>('companies').find().toArray();
  }

  async findOne(id: string): Promise<Company> {
    const company = await this.db
      .getCollection<Company>('companies')
      .findOne({ _id: new ObjectId(id) });

    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }
    return company;
  }

  async findByEmail(email: string): Promise<Company | null> {
    return this.db.getCollection<Company>('companies').findOne({ email });
  }

  async exists(id: string): Promise<boolean> {
    const company = await this.db
      .getCollection<Company>('companies')
      .findOne({ _id: new ObjectId(id) });
    return !!company;
  }

  async update(id: string, updateData: Partial<CreateCompanyDto>): Promise<Company> {
    // If password is being updated, hash it
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const result = await this.db
      .getCollection<Company>('companies')
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...updateData, updatedAt: new Date() } },
        { returnDocument: 'after' }
      );

    if (!result) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    return result;
  }

  async delete(id: string): Promise<void> {
    const result = await this.db
      .getCollection<Company>('companies')
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }
  }
}

