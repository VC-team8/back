import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { ResourcesService } from './resources.service';
import { DatabaseService } from '../../database/database.service';
import { CompaniesService } from '../companies/companies.service';
import { UploadResourceDto, AddUrlResourceDto } from './dto/upload-resource.dto';
import { Resource } from './resource.interface';

describe('ResourcesService', () => {
  let service: ResourcesService;
  let databaseService: DatabaseService;
  let companiesService: CompaniesService;

  const mockCompanyId = new ObjectId();
  const mockResourceId = new ObjectId();

  const mockCollection = {
    find: jest.fn(),
    findOne: jest.fn(),
    insertOne: jest.fn(),
    deleteOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResourcesService,
        {
          provide: DatabaseService,
          useValue: {
            getCollection: jest.fn().mockReturnValue(mockCollection),
          },
        },
        {
          provide: CompaniesService,
          useValue: {
            exists: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ResourcesService>(ResourcesService);
    databaseService = module.get<DatabaseService>(DatabaseService);
    companiesService = module.get<CompaniesService>(CompaniesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadFile', () => {
    it('should upload file and initialize tags as empty array', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 1024,
        filename: 'file-123456.pdf',
        path: '/uploads/file-123456.pdf',
        destination: '/uploads',
        stream: null,
        buffer: null,
      } as any;

      const uploadDto: UploadResourceDto = {
        companyId: mockCompanyId.toString(),
        title: 'Test Document',
      };

      jest.spyOn(companiesService, 'exists').mockResolvedValue(true);
      mockCollection.insertOne.mockResolvedValue({
        insertedId: mockResourceId,
      });

      const result = await service.uploadFile(mockFile, uploadDto);

      expect(companiesService.exists).toHaveBeenCalledWith(mockCompanyId.toString());
      expect(mockCollection.insertOne).toHaveBeenCalledWith({
        companyId: mockCompanyId,
        type: 'file',
        title: 'Test Document',
        fileUrl: `/uploads/${mockFile.filename}`,
        tags: [],
        createdAt: expect.any(Date),
      });
      expect(result).toMatchObject({
        companyId: mockCompanyId,
        type: 'file',
        title: 'Test Document',
        tags: [],
        _id: mockResourceId,
      });
    });

    it('should use original filename if title not provided', async () => {
      const mockFile: Express.Multer.File = {
        originalname: 'document.pdf',
        filename: 'file-123456.pdf',
      } as any;

      const uploadDto: UploadResourceDto = {
        companyId: mockCompanyId.toString(),
        title: '',
      };

      jest.spyOn(companiesService, 'exists').mockResolvedValue(true);
      mockCollection.insertOne.mockResolvedValue({
        insertedId: mockResourceId,
      });

      const result = await service.uploadFile(mockFile, uploadDto);

      expect(result.title).toBe('document.pdf');
    });

    it('should throw NotFoundException if company does not exist', async () => {
      const mockFile: Express.Multer.File = {
        originalname: 'test.pdf',
        filename: 'file-123456.pdf',
      } as any;

      const uploadDto: UploadResourceDto = {
        companyId: mockCompanyId.toString(),
        title: 'Test',
      };

      jest.spyOn(companiesService, 'exists').mockResolvedValue(false);

      await expect(service.uploadFile(mockFile, uploadDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.uploadFile(mockFile, uploadDto)).rejects.toThrow(
        `Company with ID ${mockCompanyId.toString()} not found`,
      );
    });
  });

  describe('addUrlResource', () => {
    it('should add URL resource and initialize tags as empty array', async () => {
      const addUrlDto: AddUrlResourceDto = {
        companyId: mockCompanyId.toString(),
        title: 'Test URL',
        url: 'https://example.com/docs',
      };

      jest.spyOn(companiesService, 'exists').mockResolvedValue(true);
      mockCollection.insertOne.mockResolvedValue({
        insertedId: mockResourceId,
      });

      const result = await service.addUrlResource(addUrlDto);

      expect(companiesService.exists).toHaveBeenCalledWith(mockCompanyId.toString());
      expect(mockCollection.insertOne).toHaveBeenCalledWith({
        companyId: mockCompanyId,
        type: 'url',
        title: 'Test URL',
        url: 'https://example.com/docs',
        tags: [],
        createdAt: expect.any(Date),
      });
      expect(result).toMatchObject({
        companyId: mockCompanyId,
        type: 'url',
        title: 'Test URL',
        url: 'https://example.com/docs',
        tags: [],
        _id: mockResourceId,
      });
    });

    it('should throw NotFoundException if company does not exist', async () => {
      const addUrlDto: AddUrlResourceDto = {
        companyId: mockCompanyId.toString(),
        title: 'Test URL',
        url: 'https://example.com',
      };

      jest.spyOn(companiesService, 'exists').mockResolvedValue(false);

      await expect(service.addUrlResource(addUrlDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for invalid URL', async () => {
      const addUrlDto: AddUrlResourceDto = {
        companyId: mockCompanyId.toString(),
        title: 'Invalid URL',
        url: 'not-a-valid-url',
      };

      jest.spyOn(companiesService, 'exists').mockResolvedValue(true);

      await expect(service.addUrlResource(addUrlDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.addUrlResource(addUrlDto)).rejects.toThrow(
        'Invalid URL format',
      );
    });
  });

  describe('findAllByCompany', () => {
    it('should return all resources for a company', async () => {
      const mockResources: Resource[] = [
        {
          _id: mockResourceId,
          companyId: mockCompanyId,
          type: 'file',
          title: 'Test File',
          fileUrl: '/uploads/file.pdf',
          tags: [],
          createdAt: new Date(),
        },
        {
          _id: new ObjectId(),
          companyId: mockCompanyId,
          type: 'url',
          title: 'Test URL',
          url: 'https://example.com',
          tags: [],
          createdAt: new Date(),
        },
      ];

      jest.spyOn(companiesService, 'exists').mockResolvedValue(true);
      mockCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockResources),
      });

      const result = await service.findAllByCompany(mockCompanyId.toString());

      expect(result).toEqual(mockResources);
      expect(mockCollection.find).toHaveBeenCalledWith({
        companyId: mockCompanyId,
      });
    });

    it('should throw NotFoundException if company does not exist', async () => {
      jest.spyOn(companiesService, 'exists').mockResolvedValue(false);

      await expect(
        service.findAllByCompany(mockCompanyId.toString()),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return a resource by id', async () => {
      const mockResource: Resource = {
        _id: mockResourceId,
        companyId: mockCompanyId,
        type: 'file',
        title: 'Test File',
        fileUrl: '/uploads/file.pdf',
        tags: [],
        createdAt: new Date(),
      };

      mockCollection.findOne.mockResolvedValue(mockResource);

      const result = await service.findOne(mockResourceId.toString());

      expect(result).toEqual(mockResource);
      expect(mockCollection.findOne).toHaveBeenCalledWith({
        _id: mockResourceId,
      });
    });

    it('should throw NotFoundException if resource not found', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockResourceId.toString())).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a resource', async () => {
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

      await service.remove(mockResourceId.toString());

      expect(mockCollection.deleteOne).toHaveBeenCalledWith({
        _id: mockResourceId,
      });
    });

    it('should throw NotFoundException if resource not found', async () => {
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });

      await expect(service.remove(mockResourceId.toString())).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
