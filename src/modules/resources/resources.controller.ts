import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ValidationPipe,
  UsePipes,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ResourcesService } from './resources.service';
import { UploadResourceDto, AddUrlResourceDto } from './dto/upload-resource.dto';
import { Resource } from './resource.interface';
import { Response } from 'express';
import { memoryStorage } from 'multer';
import { AiService } from '../ai/ai.service';

const storage = memoryStorage();

@ApiTags('Resources')
@Controller('resources')
@UsePipes(new ValidationPipe({ transform: true }))
export class ResourcesController {
  constructor(
    private readonly resourcesService: ResourcesService,
    @Inject(forwardRef(() => AiService))
    private readonly aiService: AiService,
  ) {}

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
        title: {
          type: 'string',
          description: 'Resource title',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or company ID' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadResourceDto,
  ): Promise<Resource> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file type
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
    const supportedExtensions = ['pdf', 'md', 'txt', 'doc', 'docx'];

    if (!fileExtension || !supportedExtensions.includes(fileExtension)) {
      throw new BadRequestException(
        `Unsupported file type. Supported types: ${supportedExtensions.join(', ')}`
      );
    }

    const resource = await this.resourcesService.uploadFile(file, uploadDto);

    // Automatically process file for embeddings (async, fire-and-forget)
    // Only process PDF and MD files (we can add more later)
    if (fileExtension === 'pdf' || fileExtension === 'md') {
      this.aiService.processFile(resource.id).catch(err => {
        console.error(`Failed to process file ${resource.id}:`, err);
      });
    }

    return resource;
  }

  @Post('url')
  @ApiOperation({ summary: 'Add URL resource' })
  @ApiResponse({ status: 201, description: 'URL resource added successfully' })
  @ApiResponse({ status: 400, description: 'Invalid URL or input data' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async addUrl(@Body() addUrlResourceDto: AddUrlResourceDto): Promise<Resource> {
    return this.resourcesService.addUrlResource(addUrlResourceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all resources' })
  @ApiResponse({ status: 200, description: 'List of all resources' })
  async findAll(): Promise<Resource[]> {
    return this.resourcesService.findAll();
  }

  @Get('company/:companyId')
  @ApiOperation({ summary: 'Get resources by company ID' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'List of resources' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async findByCompany(@Param('companyId') companyId: string): Promise<Resource[]> {
    return this.resourcesService.findAllByCompany(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get resource by ID' })
  @ApiParam({ name: 'id', description: 'Resource ID' })
  @ApiResponse({ status: 200, description: 'Resource found' })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  async findOne(@Param('id') id: string): Promise<Resource> {
    return this.resourcesService.findOne(id);
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

  @Get(':id/download')
  @ApiOperation({ summary: 'Download file from resource' })
  @ApiParam({ name: 'id', description: 'Resource ID' })
  @ApiResponse({ status: 200, description: 'File downloaded successfully' })
  @ApiResponse({ status: 404, description: 'Resource not found or not a file' })
  async downloadFile(@Param('id') id: string, @Res() res: Response): Promise<void> {
    const resource = await this.resourcesService.findOne(id);

    if (resource.type !== 'file' || !resource.fileData) {
      throw new BadRequestException('Resource is not a file or file data not found');
    }

    res.set({
      'Content-Type': resource.mimeType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${resource.fileName || 'download'}"`,
      'Content-Length': resource.fileSize || resource.fileData.length,
    });

    res.send(resource.fileData);
  }
}
