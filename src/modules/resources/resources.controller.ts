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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ResourcesService } from './resources.service';
import { UploadResourceDto, AddUrlResourceDto } from './dto/upload-resource.dto';
import { Resource } from './resource.interface';
import { appConfig } from '../../config/app.config';
import { diskStorage } from 'multer';

const storage = diskStorage({
  destination: appConfig.uploadPath,
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix);
  },
});

@ApiTags('Resources')
@Controller('resources')
@UsePipes(new ValidationPipe({ transform: true }))
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

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

    return this.resourcesService.uploadFile(file, uploadDto);
  }

  @Post('url')
  @ApiOperation({ summary: 'Add URL resource' })
  @ApiResponse({ status: 201, description: 'URL resource added successfully' })
  @ApiResponse({ status: 400, description: 'Invalid URL or input data' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async addUrl(@Body() addUrlResourceDto: AddUrlResourceDto): Promise<Resource> {
    return this.resourcesService.addUrlResource(addUrlResourceDto);
  }

  @Get('companies/:companyId')
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
}
