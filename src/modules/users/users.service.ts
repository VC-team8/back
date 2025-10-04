import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { User } from './user.interface';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(companyId: string, createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user: Omit<User, '_id'> = {
      companyId: new ObjectId(companyId),
      email: createUserDto.email,
      password: hashedPassword,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      createdAt: new Date(),
    };

    const result = await this.databaseService.getCollection('users').insertOne(user);
    return { ...user, _id: result.insertedId };
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.databaseService.getCollection<User>('users').findOne({ email });
  }

  async findById(id: string): Promise<User | null> {
    return this.databaseService.getCollection<User>('users').findOne({ _id: new ObjectId(id) });
  }

  async findByCompanyId(companyId: string): Promise<User[]> {
    return this.databaseService
      .getCollection<User>('users')
      .find({ companyId: new ObjectId(companyId) })
      .toArray();
  }
}
