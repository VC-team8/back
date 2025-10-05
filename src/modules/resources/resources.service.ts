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

  async findAll(): Promise<any[]> {
    const resources = await this.db
      .getCollection<Resource>('resources')
      .find({})
      .toArray();

    return resources.map(res => ({
      ...res,
      id: res._id.toString(),
      _id: res._id.toString(),
      companyId: res.companyId.toString(),
      fileData: undefined, // Don't send binary data in list
      fileUrl: res.type === 'file' ? `http://localhost:8000/api/resources/${res._id.toString()}/download` : undefined,
    }));
  }

  async findAllByCompany(companyId: string): Promise<any[]> {
    const companyExists = await this.companiesService.exists(companyId);
    if (!companyExists) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    const resources = await this.db
      .getCollection<Resource>('resources')
      .find({ companyId: new ObjectId(companyId) })
      .toArray();

    return resources.map(res => ({
      ...res,
      id: res._id.toString(),
      _id: res._id.toString(),
      companyId: companyId,
      fileData: undefined, // Don't send binary data in list
      fileUrl: res.type === 'file' ? `http://localhost:8000/api/resources/${res._id.toString()}/download` : undefined,
    }));
  }

  async findOne(id: string): Promise<any> {
    const resource = await this.db
      .getCollection<Resource>('resources')
      .findOne({ _id: new ObjectId(id) });

    if (!resource) {
      throw new NotFoundException(`Resource with ID ${id} not found`);
    }

    return {
      ...resource,
      id: resource._id.toString(),
      _id: resource._id.toString(),
      companyId: resource.companyId.toString(),
    };
  }

  async remove(id: string): Promise<void> {
    const result = await this.db
      .getCollection<Resource>('resources')
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      throw new NotFoundException(`Resource with ID ${id} not found`);
    }
  }

  async addUrlResource(addUrlResourceDto: AddUrlResourceDto): Promise<any> {
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
      tags: [],
      createdAt: new Date(),
    };

    const result = await this.db
      .getCollection<Resource>('resources')
      .insertOne(resource);

    return {
      ...resource,
      id: result.insertedId.toString(),
      _id: result.insertedId.toString(),
      companyId: addUrlResourceDto.companyId,
    };
  }

  async uploadFile(
    file: Express.Multer.File,
    uploadDto: UploadResourceDto,
  ): Promise<any> {
    const companyExists = await this.companiesService.exists(uploadDto.companyId);
    if (!companyExists) {
      throw new NotFoundException(`Company with ID ${uploadDto.companyId} not found`);
    }

    const resource: Resource = {
      companyId: new ObjectId(uploadDto.companyId),
      type: 'file',
      title: uploadDto.title || file.originalname,
      fileName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      fileData: file.buffer,
      tags: [],
      createdAt: new Date(),
    };

    const result = await this.db
      .getCollection<Resource>('resources')
      .insertOne(resource);

    const { fileData, ...resourceWithoutBuffer } = resource;
    return {
      ...resourceWithoutBuffer,
      id: result.insertedId.toString(),
      _id: result.insertedId.toString(),
      companyId: uploadDto.companyId,
      fileUrl: `http://localhost:8000/api/resources/${result.insertedId.toString()}/download`,
    };
  }
}

