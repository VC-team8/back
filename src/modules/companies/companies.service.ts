import { Injectable, NotFoundException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { DatabaseService } from '../../database/database.service';
import { Company } from './company.interface';
import { CreateCompanyDto } from './dto/create-company.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CompaniesService {
  constructor(private readonly db: DatabaseService) {}

  async create(createCompanyDto: CreateCompanyDto): Promise<Company> {
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

    return { ...company, _id: result.insertedId };
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
}

