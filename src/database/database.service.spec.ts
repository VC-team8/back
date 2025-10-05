import { Test, TestingModule } from '@nestjs/testing';
import { MongoClient, Db } from 'mongodb';
import { DatabaseService } from './database.service';

// Mock MongoDB
jest.mock('mongodb', () => {
  const mockDb = {
    collection: jest.fn(),
  };

  const mockClient = {
    connect: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
    db: jest.fn().mockReturnValue(mockDb),
  };

  return {
    MongoClient: jest.fn(() => mockClient),
    Db: jest.fn(),
  };
});

describe('DatabaseService', () => {
  let service: DatabaseService;
  let mockClient: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DatabaseService],
    }).compile();

    service = module.get<DatabaseService>(DatabaseService);
    mockClient = new MongoClient('');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should connect to MongoDB with default URI', async () => {
      const originalEnv = process.env.MONGODB_URI;
      delete process.env.MONGODB_URI;

      await service.onModuleInit();

      expect(MongoClient).toHaveBeenCalledWith('mongodb://localhost:27017/onboard-ai');
      expect(mockClient.connect).toHaveBeenCalled();
      expect(mockClient.db).toHaveBeenCalledWith('onboard-ai');

      process.env.MONGODB_URI = originalEnv;
    });

    it('should connect to MongoDB with environment URI', async () => {
      const testUri = 'mongodb://testhost:27017/testdb';
      process.env.MONGODB_URI = testUri;

      await service.onModuleInit();

      expect(MongoClient).toHaveBeenCalledWith(testUri);
      expect(mockClient.connect).toHaveBeenCalled();
      expect(mockClient.db).toHaveBeenCalledWith('testdb');
    });

    it('should extract database name from URI with query parameters', async () => {
      process.env.MONGODB_URI = 'mongodb://host:27017/mydb?retryWrites=true';

      await service.onModuleInit();

      expect(mockClient.db).toHaveBeenCalledWith('mydb');
    });

    it('should handle connection errors', async () => {
      mockClient.connect.mockRejectedValueOnce(new Error('Connection failed'));

      await expect(service.onModuleInit()).rejects.toThrow('Connection failed');
    });
  });

  describe('onModuleDestroy', () => {
    it('should close MongoDB connection', async () => {
      await service.onModuleInit();
      await service.onModuleDestroy();

      expect(mockClient.close).toHaveBeenCalled();
    });
  });

  describe('getDb', () => {
    it('should return database instance', async () => {
      await service.onModuleInit();
      const db = service.getDb();

      expect(db).toBeDefined();
      expect(mockClient.db).toHaveBeenCalled();
    });
  });

  describe('getCollection', () => {
    it('should return collection from database', async () => {
      const mockCollection = { name: 'users' };
      mockClient.db().collection.mockReturnValue(mockCollection);

      await service.onModuleInit();
      const collection = service.getCollection('users');

      expect(mockClient.db().collection).toHaveBeenCalledWith('users');
      expect(collection).toEqual(mockCollection);
    });

    it('should support generic type parameter', async () => {
      interface User {
        name: string;
        email: string;
      }

      const mockCollection = { name: 'users' };
      mockClient.db().collection.mockReturnValue(mockCollection);

      await service.onModuleInit();
      const collection = service.getCollection<User>('users');

      expect(collection).toBeDefined();
    });
  });
});
