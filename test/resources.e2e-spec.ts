import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ObjectId } from 'mongodb';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/database/database.service';
import * as path from 'path';
import * as fs from 'fs';

describe('Resources (e2e)', () => {
  let app: INestApplication;
  let dbService: DatabaseService;
  let testCompanyId: ObjectId;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dbService = moduleFixture.get<DatabaseService>(DatabaseService);

    // Create a test company
    const company = await dbService.getCollection('companies').insertOne({
      name: 'Test Company',
      email: 'test@example.com',
      industry: 'Technology',
      size: '10-50',
      contactName: 'Test User',
      createdAt: new Date(),
    });
    testCompanyId = company.insertedId;
  });

  afterAll(async () => {
    // Clean up test data
    await dbService.getCollection('resources').deleteMany({ companyId: testCompanyId });
    await dbService.getCollection('companies').deleteOne({ _id: testCompanyId });
    await app.close();
  });

  describe('/api/resources/upload (POST)', () => {
    it('should upload a file and store it with empty tags array', async () => {
      // Create a temporary test file
      const testFilePath = path.join(__dirname, 'test-file.txt');
      fs.writeFileSync(testFilePath, 'This is a test file content');

      const response = await request(app.getHttpServer())
        .post('/api/resources/upload')
        .field('companyId', testCompanyId.toString())
        .field('title', 'Test Document')
        .attach('file', testFilePath)
        .expect(201);

      // Clean up test file
      fs.unlinkSync(testFilePath);

      expect(response.body).toMatchObject({
        companyId: testCompanyId.toString(),
        type: 'file',
        title: 'Test Document',
        tags: [],
      });
      expect(response.body._id).toBeDefined();
      expect(response.body.fileUrl).toMatch(/\/uploads\/file-/);
      expect(response.body.createdAt).toBeDefined();

      // Verify in database
      const resource = await dbService
        .getCollection('resources')
        .findOne({ _id: new ObjectId(response.body._id) });

      expect(resource).toBeTruthy();
      expect(resource.tags).toEqual([]);
    });

    it('should return 400 when no file is uploaded', async () => {
      await request(app.getHttpServer())
        .post('/api/resources/upload')
        .field('companyId', testCompanyId.toString())
        .field('title', 'Test Document')
        .expect(400);
    });

    it('should return 404 when company does not exist', async () => {
      const testFilePath = path.join(__dirname, 'test-file.txt');
      fs.writeFileSync(testFilePath, 'Test content');

      const fakeCompanyId = new ObjectId();
      await request(app.getHttpServer())
        .post('/api/resources/upload')
        .field('companyId', fakeCompanyId.toString())
        .field('title', 'Test Document')
        .attach('file', testFilePath)
        .expect(404);

      fs.unlinkSync(testFilePath);
    });
  });

  describe('/api/resources/url (POST)', () => {
    it('should add URL resource with empty tags array', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/resources/url')
        .send({
          companyId: testCompanyId.toString(),
          title: 'Company Docs',
          url: 'https://example.com/docs',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        companyId: testCompanyId.toString(),
        type: 'url',
        title: 'Company Docs',
        url: 'https://example.com/docs',
        tags: [],
      });
      expect(response.body._id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();

      // Verify in database
      const resource = await dbService
        .getCollection('resources')
        .findOne({ _id: new ObjectId(response.body._id) });

      expect(resource).toBeTruthy();
      expect(resource.tags).toEqual([]);
    });

    it('should return 400 for invalid URL format', async () => {
      await request(app.getHttpServer())
        .post('/api/resources/url')
        .send({
          companyId: testCompanyId.toString(),
          title: 'Invalid URL',
          url: 'not-a-valid-url',
        })
        .expect(400);
    });

    it('should return 404 when company does not exist', async () => {
      const fakeCompanyId = new ObjectId();
      await request(app.getHttpServer())
        .post('/api/resources/url')
        .send({
          companyId: fakeCompanyId.toString(),
          title: 'Test URL',
          url: 'https://example.com',
        })
        .expect(404);
    });
  });

  describe('/api/resources/companies/:companyId (GET)', () => {
    it('should return all resources for a company with tags field', async () => {
      // Create test resources
      const fileResource = await dbService.getCollection('resources').insertOne({
        companyId: testCompanyId,
        type: 'file',
        title: 'Test File',
        fileUrl: '/uploads/test-file.pdf',
        tags: [],
        createdAt: new Date(),
      });

      const urlResource = await dbService.getCollection('resources').insertOne({
        companyId: testCompanyId,
        type: 'url',
        title: 'Test URL',
        url: 'https://example.com',
        tags: [],
        createdAt: new Date(),
      });

      const response = await request(app.getHttpServer())
        .get(`/api/resources/companies/${testCompanyId.toString()}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThanOrEqual(2);

      response.body.forEach((resource: any) => {
        expect(resource).toHaveProperty('tags');
        expect(resource.tags).toEqual([]);
      });
    });

    it('should return 404 when company does not exist', async () => {
      const fakeCompanyId = new ObjectId();
      await request(app.getHttpServer())
        .get(`/api/resources/companies/${fakeCompanyId.toString()}`)
        .expect(404);
    });
  });

  describe('/api/resources/:id (DELETE)', () => {
    it('should delete a resource', async () => {
      const resource = await dbService.getCollection('resources').insertOne({
        companyId: testCompanyId,
        type: 'file',
        title: 'To Delete',
        fileUrl: '/uploads/delete-me.pdf',
        tags: [],
        createdAt: new Date(),
      });

      await request(app.getHttpServer())
        .delete(`/api/resources/${resource.insertedId.toString()}`)
        .expect(200);

      const deleted = await dbService
        .getCollection('resources')
        .findOne({ _id: resource.insertedId });

      expect(deleted).toBeNull();
    });

    it('should return 404 when resource does not exist', async () => {
      const fakeResourceId = new ObjectId();
      await request(app.getHttpServer())
        .delete(`/api/resources/${fakeResourceId.toString()}`)
        .expect(404);
    });
  });
});
