import { Injectable, NotFoundException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { DatabaseService } from '../../database/database.service';
import { Company } from './company.interface';
import { CreateCompanyDto } from './dto/create-company.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CompaniesService {
  constructor(private readonly db: DatabaseService) {}

  // Transform MongoDB document to API response
  private serializeCompany(company: Company): any {
    const { _id, password, ...rest } = company;
    return {
      id: _id?.toString(),
      ...rest,
      createdAt: company.createdAt.toISOString(),
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

    return this.serializeCompany({ ...company, _id: result.insertedId });
  }

  async findAll(): Promise<any[]> {
    const companies = await this.db.getCollection<Company>('companies').find().toArray();
    return companies.map(c => this.serializeCompany(c));
  }

  async findOne(id: string): Promise<any> {
    const company = await this.db
      .getCollection<Company>('companies')
      .findOne({ _id: new ObjectId(id) });

    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }
    return this.serializeCompany(company);
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
}

