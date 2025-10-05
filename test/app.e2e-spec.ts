import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('OnboardAI API Integration Tests (e2e)', () => {
  let app: INestApplication;
  let companyId: string;
  let employeeId: string;
  let resourceId: string;
  let conversationId: string;
  let messageId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Apply same configuration as main.ts
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('/api/health (GET) - should return healthy status', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'healthy');
          expect(res.body).toHaveProperty('timestamp');
        });
    });
  });

  describe('Company Registration & Management', () => {
    const companyData = {
      name: 'Test Company Inc.',
      industry: 'technology',
      size: '11-50',
      contactName: 'John Doe',
      email: `test-company-${Date.now()}@example.com`,
      password: 'securePassword123',
    };

    it('/api/companies (POST) - should register a new company', () => {
      return request(app.getHttpServer())
        .post('/api/companies')
        .send(companyData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body).toHaveProperty('name', companyData.name);
          expect(res.body).toHaveProperty('industry', companyData.industry);
          expect(res.body).toHaveProperty('email', companyData.email);
          expect(res.body).not.toHaveProperty('password'); // Password should not be returned
          companyId = res.body._id;
        });
    });

    it('/api/companies (POST) - should fail with duplicate email', () => {
      return request(app.getHttpServer())
        .post('/api/companies')
        .send(companyData)
        .expect(409); // Conflict
    });

    it('/api/companies (POST) - should fail with invalid data', () => {
      return request(app.getHttpServer())
        .post('/api/companies')
        .send({
          name: 'A', // Too short
          industry: 'invalid-industry',
          size: 'invalid-size',
        })
        .expect(400);
    });

    it('/api/companies/:id (GET) - should get company by id', () => {
      return request(app.getHttpServer())
        .get(`/api/companies/${companyId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id', companyId);
          expect(res.body).toHaveProperty('name', companyData.name);
        });
    });

    it('/api/companies/:id (GET) - should return 404 for non-existent company', () => {
      return request(app.getHttpServer())
        .get('/api/companies/507f1f77bcf86cd799439011')
        .expect(404);
    });

    it('/api/companies/:id (PATCH) - should update company', () => {
      const updateData = {
        name: 'Updated Company Name',
        industry: 'healthcare',
      };

      return request(app.getHttpServer())
        .patch(`/api/companies/${companyId}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('name', updateData.name);
          expect(res.body).toHaveProperty('industry', updateData.industry);
        });
    });
  });

  describe('Employee Registration & Email Creation', () => {
    const employeeData = {
      name: 'Alice Smith',
      email: `test-employee-${Date.now()}@example.com`,
      password: 'employeePass123',
      companyId: '', // Will be set dynamically
      department: 'engineering',
      tags: {
        roles: ['developer', 'team-lead'],
        skills: ['javascript', 'react', 'node.js'],
        interests: ['ai', 'web-development'],
      },
    };

    it('/api/employees (POST) - should register a new employee', () => {
      employeeData.companyId = companyId;

      return request(app.getHttpServer())
        .post('/api/employees')
        .send(employeeData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body).toHaveProperty('name', employeeData.name);
          expect(res.body).toHaveProperty('email', employeeData.email);
          expect(res.body).toHaveProperty('companyId', companyId);
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).not.toHaveProperty('password');
          employeeId = res.body._id;
        });
    });

    it('/api/employees (POST) - should fail with invalid company ID', () => {
      return request(app.getHttpServer())
        .post('/api/employees')
        .send({
          ...employeeData,
          companyId: '507f1f77bcf86cd799439011',
          email: `different-${Date.now()}@example.com`,
        })
        .expect(404);
    });

    it('/api/employees/create-email (POST) - should create employee email', () => {
      const emailData = {
        companyId: companyId,
        email: `corporate-${Date.now()}@company.com`,
        password: 'GeneratedPass123!@#',
      };

      return request(app.getHttpServer())
        .post('/api/employees/create-email')
        .send(emailData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body).toHaveProperty('email', emailData.email);
          expect(res.body).toHaveProperty('password', emailData.password);
          expect(res.body).toHaveProperty('companyId', companyId);
        });
    });

    it('/api/employees/create-email (POST) - should fail with duplicate email', () => {
      const emailData = {
        companyId: companyId,
        email: employeeData.email, // Duplicate
        password: 'AnotherPass123',
      };

      return request(app.getHttpServer())
        .post('/api/employees/create-email')
        .send(emailData)
        .expect(409);
    });
  });

  describe('Resource Management', () => {
    it('/api/resources/url (POST) - should add URL resource', () => {
      const urlData = {
        companyId: companyId,
        url: 'https://company-wiki.com/onboarding',
        title: 'Company Wiki - Onboarding',
      };

      return request(app.getHttpServer())
        .post('/api/resources/url')
        .send(urlData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body).toHaveProperty('type', 'url');
          expect(res.body).toHaveProperty('url', urlData.url);
          expect(res.body).toHaveProperty('title', urlData.title);
          expect(res.body).toHaveProperty('companyId', companyId);
          resourceId = res.body._id;
        });
    });

    it('/api/resources/url (POST) - should fail with invalid URL', () => {
      return request(app.getHttpServer())
        .post('/api/resources/url')
        .send({
          companyId: companyId,
          url: 'not-a-valid-url',
          title: 'Invalid URL',
        })
        .expect(400);
    });

    it('/api/companies/:companyId/resources (GET) - should list company resources', () => {
      return request(app.getHttpServer())
        .get(`/api/companies/${companyId}/resources`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('_id', resourceId);
          expect(res.body[0]).toHaveProperty('type', 'url');
        });
    });

    it('/api/companies/:companyId/resources (GET) - should filter by type', () => {
      return request(app.getHttpServer())
        .get(`/api/companies/${companyId}/resources?type=url`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach((resource) => {
            expect(resource).toHaveProperty('type', 'url');
          });
        });
    });

    it('/api/resources/:id (DELETE) - should delete resource', () => {
      return request(app.getHttpServer())
        .delete(`/api/resources/${resourceId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });
    });

    it('/api/resources/:id (DELETE) - should return 404 for non-existent resource', () => {
      return request(app.getHttpServer())
        .delete('/api/resources/507f1f77bcf86cd799439011')
        .expect(404);
    });
  });

  describe('Conversation & Chat', () => {
    beforeAll(async () => {
      // Create a resource for AI to reference
      const urlData = {
        companyId: companyId,
        url: 'https://company.com/handbook',
        title: 'Employee Handbook',
      };

      const res = await request(app.getHttpServer())
        .post('/api/resources/url')
        .send(urlData);
      
      resourceId = res.body._id;
    });

    it('/api/conversations (POST) - should create a new conversation', () => {
      return request(app.getHttpServer())
        .post('/api/conversations')
        .send({ companyId: companyId })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body).toHaveProperty('companyId', companyId);
          expect(res.body).toHaveProperty('createdAt');
          conversationId = res.body._id;
        });
    });

    it('/api/conversations (POST) - should fail with invalid company ID', () => {
      return request(app.getHttpServer())
        .post('/api/conversations')
        .send({ companyId: '507f1f77bcf86cd799439011' })
        .expect(404);
    });

    it('/api/companies/:companyId/conversations (GET) - should list company conversations', () => {
      return request(app.getHttpServer())
        .get(`/api/companies/${companyId}/conversations`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('_id', conversationId);
        });
    });

    it('/api/conversations/:conversationId/messages (POST) - should send a message and get AI response', async () => {
      const messageContent = 'What are the company core values?';

      const response = await request(app.getHttpServer())
        .post(`/api/conversations/${conversationId}/messages`)
        .send({ content: messageContent })
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('role', 'assistant');
      expect(response.body).toHaveProperty('content');
      expect(response.body.content.length).toBeGreaterThan(0);
      expect(response.body).toHaveProperty('conversationId', conversationId);
      messageId = response.body._id;
    }, 30000); // Increased timeout for AI response

    it('/api/conversations/:conversationId/messages (GET) - should get conversation messages', () => {
      return request(app.getHttpServer())
        .get(`/api/conversations/${conversationId}/messages`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThanOrEqual(2); // User message + AI response
          
          const userMessage = res.body.find(m => m.role === 'user');
          const aiMessage = res.body.find(m => m.role === 'assistant');
          
          expect(userMessage).toBeDefined();
          expect(aiMessage).toBeDefined();
          expect(aiMessage).toHaveProperty('content');
        });
    });

    it('/api/conversations/:conversationId/messages (POST) - should fail with empty content', () => {
      return request(app.getHttpServer())
        .post(`/api/conversations/${conversationId}/messages`)
        .send({ content: '' })
        .expect(400);
    });

    it('/api/conversations/:conversationId/messages (POST) - should fail with non-existent conversation', () => {
      return request(app.getHttpServer())
        .post('/api/conversations/507f1f77bcf86cd799439011/messages')
        .send({ content: 'Test message' })
        .expect(404);
    });
  });

  describe('Pagination & Filtering', () => {
    beforeAll(async () => {
      // Create multiple resources for pagination testing
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/api/resources/url')
          .send({
            companyId: companyId,
            url: `https://example.com/page-${i}`,
            title: `Resource ${i}`,
          });
      }
    });

    it('/api/companies/:companyId/resources (GET) - should support limit parameter', () => {
      return request(app.getHttpServer())
        .get(`/api/companies/${companyId}/resources?limit=3`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeLessThanOrEqual(3);
        });
    });

    it('/api/companies/:companyId/resources (GET) - should support skip parameter', () => {
      return request(app.getHttpServer())
        .get(`/api/companies/${companyId}/resources?skip=2&limit=2`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeLessThanOrEqual(2);
        });
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoints', () => {
      return request(app.getHttpServer())
        .get('/api/non-existent-endpoint')
        .expect(404);
    });

    it('should return 400 for invalid MongoDB ObjectId', () => {
      return request(app.getHttpServer())
        .get('/api/companies/invalid-id')
        .expect(400);
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/api/companies')
        .send({
          name: 'Test',
          // Missing required fields
        })
        .expect(400);
    });

    it('should reject unknown fields with forbidNonWhitelisted', () => {
      return request(app.getHttpServer())
        .post('/api/companies')
        .send({
          name: 'Test Company',
          industry: 'technology',
          size: '1-10',
          contactName: 'John',
          email: `test-${Date.now()}@example.com`,
          password: 'pass123',
          unknownField: 'should be rejected',
        })
        .expect(400);
    });
  });

  describe('Data Integrity', () => {
    it('should not expose sensitive data in responses', async () => {
      const companyResponse = await request(app.getHttpServer())
        .get(`/api/companies/${companyId}`)
        .expect(200);

      expect(companyResponse.body).not.toHaveProperty('password');
      expect(companyResponse.body).not.toHaveProperty('__v');
    });

    it('should properly handle MongoDB ObjectId conversion', () => {
      return request(app.getHttpServer())
        .get(`/api/companies/${companyId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body._id).toBe(companyId);
          expect(typeof res.body._id).toBe('string');
        });
    });

    it('should enforce unique constraints', async () => {
      const emailData = {
        companyId: companyId,
        email: 'duplicate@test.com',
        password: 'Test123',
      };

      // First creation should succeed
      await request(app.getHttpServer())
        .post('/api/employees/create-email')
        .send(emailData)
        .expect(201);

      // Duplicate should fail
      await request(app.getHttpServer())
        .post('/api/employees/create-email')
        .send(emailData)
        .expect(409);
    });
  });
});

