import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Resource, ResourceDocument } from './resource.schema';
import { CreateResourceDto, UpdateResourceDto, AddUrlResourceDto } from '../../common/dto/resource.dto';
import { CompaniesService } from '../companies/companies.service';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectModel(Resource.name) private resourceModel: Model<ResourceDocument>,
    private companiesService: CompaniesService,
  ) {}

  async create(createResourceDto: CreateResourceDto): Promise<Resource> {
    // Verify company exists
    const companyExists = await this.companiesService.exists(createResourceDto.companyId);
    if (!companyExists) {
      throw new NotFoundException(`Company with ID ${createResourceDto.companyId} not found`);
    }

    const createdResource = new this.resourceModel(createResourceDto);
    return createdResource.save();
  }

  async findAllByCompany(companyId: string): Promise<Resource[]> {
    // Verify company exists
    const companyExists = await this.companiesService.exists(companyId);
    if (!companyExists) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    return this.resourceModel.find({ companyId }).exec();
  }

  async findOne(id: string): Promise<Resource> {
    const resource = await this.resourceModel.findById(id).exec();
    if (!resource) {
      throw new NotFoundException(`Resource with ID ${id} not found`);
    }
    return resource;
  }

  async update(id: string, updateResourceDto: UpdateResourceDto): Promise<Resource> {
    const updatedResource = await this.resourceModel
      .findByIdAndUpdate(id, updateResourceDto, { new: true })
      .exec();
    
    if (!updatedResource) {
      throw new NotFoundException(`Resource with ID ${id} not found`);
    }
    
    return updatedResource;
  }

  async remove(id: string): Promise<void> {
    const result = await this.resourceModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Resource with ID ${id} not found`);
    }
  }

  async addUrlResource(addUrlResourceDto: AddUrlResourceDto): Promise<Resource> {
    // Verify company exists
    const companyExists = await this.companiesService.exists(addUrlResourceDto.companyId);
    if (!companyExists) {
      throw new NotFoundException(`Company with ID ${addUrlResourceDto.companyId} not found`);
    }

    // Validate URL
    try {
      new URL(addUrlResourceDto.url);
    } catch {
      throw new BadRequestException('Invalid URL format');
    }

    const createResourceDto: CreateResourceDto = {
      companyId: addUrlResourceDto.companyId,
      type: 'url',
      title: addUrlResourceDto.title || new URL(addUrlResourceDto.url).hostname,
      url: addUrlResourceDto.url,
      processed: false,
    };

    return this.create(createResourceDto);
  }

  async processFile(file: Express.Multer.File, companyId: string): Promise<Resource> {
    // Verify company exists
    const companyExists = await this.companiesService.exists(companyId);
    if (!companyExists) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    const createResourceDto: CreateResourceDto = {
      companyId,
      type: 'file',
      title: file.originalname,
      fileUrl: `/uploads/${file.filename}`,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      processed: false,
    };

    return this.create(createResourceDto);
  }

  async markAsProcessed(id: string): Promise<Resource> {
    return this.update(id, { processed: true });
  }

  async getUnprocessedResources(): Promise<Resource[]> {
    return this.resourceModel.find({ processed: false }).exec();
  }
}

