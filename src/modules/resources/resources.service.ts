import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { DatabaseService } from '../../database/database.service';
import { Resource } from './resource.interface';
import { UploadResourceDto, AddUrlResourceDto } from './dto/upload-resource.dto';
import { CompaniesService } from '../companies/companies.service';

@Injectable()
export class ResourcesService {
  constructor(
    private readonly db: DatabaseService,
    private companiesService: CompaniesService,
  ) {}

  async findAllByCompany(companyId: string): Promise<Resource[]> {
    const companyExists = await this.companiesService.exists(companyId);
    if (!companyExists) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    return this.db
      .getCollection<Resource>('resources')
      .find({ companyId: new ObjectId(companyId) })
      .toArray();
  }

  async findOne(id: string): Promise<Resource> {
    const resource = await this.db
      .getCollection<Resource>('resources')
      .findOne({ _id: new ObjectId(id) });

    if (!resource) {
      throw new NotFoundException(`Resource with ID ${id} not found`);
    }
    return resource;
  }

  async remove(id: string): Promise<void> {
    const result = await this.db
      .getCollection<Resource>('resources')
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      throw new NotFoundException(`Resource with ID ${id} not found`);
    }
  }

  async addUrlResource(addUrlResourceDto: AddUrlResourceDto): Promise<Resource> {
    const companyExists = await this.companiesService.exists(addUrlResourceDto.companyId);
    if (!companyExists) {
      throw new NotFoundException(`Company with ID ${addUrlResourceDto.companyId} not found`);
    }

    try {
      new URL(addUrlResourceDto.url);
    } catch {
      throw new BadRequestException('Invalid URL format');
    }

    const resource: Resource = {
      companyId: new ObjectId(addUrlResourceDto.companyId),
      type: 'url',
      title: addUrlResourceDto.title,
      url: addUrlResourceDto.url,
      createdAt: new Date(),
    };

    const result = await this.db
      .getCollection<Resource>('resources')
      .insertOne(resource);

    return { ...resource, _id: result.insertedId };
  }

  async uploadFile(
    file: Express.Multer.File,
    uploadDto: UploadResourceDto,
  ): Promise<Resource> {
    const companyExists = await this.companiesService.exists(uploadDto.companyId);
    if (!companyExists) {
      throw new NotFoundException(`Company with ID ${uploadDto.companyId} not found`);
    }

    const resource: Resource = {
      companyId: new ObjectId(uploadDto.companyId),
      type: 'file',
      title: uploadDto.title || file.originalname,
      fileUrl: `/uploads/${file.filename}`,
      createdAt: new Date(),
    };

    const result = await this.db
      .getCollection<Resource>('resources')
      .insertOne(resource);

    return { ...resource, _id: result.insertedId };
  }
}

