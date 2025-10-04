import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ValidationPipe,
  UsePipes,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ResourcesService } from './resources.service';
import { CreateResourceDto, UpdateResourceDto, AddUrlResourceDto } from '../../common/dto/resource.dto';
import { Resource } from './resource.schema';
import { appConfig } from '../../config/app.config';
import * as multer from 'multer';

const storage = multer.diskStorage({
  destination: appConfig.uploadPath,
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: appConfig.maxFileSize,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
});

@ApiTags('Resources')
@Controller('resources')
@UsePipes(new ValidationPipe({ transform: true }))
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new resource' })
  @ApiResponse({ status: 201, description: 'Resource created successfully', type: Resource })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async create(@Body() createResourceDto: CreateResourceDto): Promise<Resource> {
    return this.resourcesService.create(createResourceDto);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage }))
  @ApiOperation({ summary: 'Upload a file resource' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        companyId: {
          type: 'string',
          description: 'Company ID',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully', type: Resource })
  @ApiResponse({ status: 400, description: 'Invalid file or company ID' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('companyId') companyId: string,
  ): Promise<Resource> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (!companyId) {
      throw new BadRequestException('Company ID is required');
    }
    
    return this.resourcesService.processFile(file, companyId);
  }

  @Post('url')
  @ApiOperation({ summary: 'Add URL resource' })
  @ApiResponse({ status: 201, description: 'URL resource added successfully', type: Resource })
  @ApiResponse({ status: 400, description: 'Invalid URL or input data' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async addUrl(@Body() addUrlResourceDto: AddUrlResourceDto): Promise<Resource> {
    return this.resourcesService.addUrlResource(addUrlResourceDto);
  }

  @Get('companies/:companyId')
  @ApiOperation({ summary: 'Get resources by company ID' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'List of resources', type: [Resource] })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async findByCompany(@Param('companyId') companyId: string): Promise<Resource[]> {
    return this.resourcesService.findAllByCompany(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get resource by ID' })
  @ApiParam({ name: 'id', description: 'Resource ID' })
  @ApiResponse({ status: 200, description: 'Resource found', type: Resource })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  async findOne(@Param('id') id: string): Promise<Resource> {
    return this.resourcesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update resource' })
  @ApiParam({ name: 'id', description: 'Resource ID' })
  @ApiResponse({ status: 200, description: 'Resource updated successfully', type: Resource })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async update(
    @Param('id') id: string,
    @Body() updateResourceDto: UpdateResourceDto,
  ): Promise<Resource> {
    return this.resourcesService.update(id, updateResourceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete resource' })
  @ApiParam({ name: 'id', description: 'Resource ID' })
  @ApiResponse({ status: 200, description: 'Resource deleted successfully' })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.resourcesService.remove(id);
    return { message: 'Resource deleted successfully' };
  }
}
