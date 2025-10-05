# 🧪 Integration Tests Documentation

## Overview

Comprehensive integration tests for the OnboardAI backend API. These tests cover all major endpoints and user flows.

---

## 🚀 Quick Start

### Prerequisites

1. **MongoDB** must be running (local or Docker)
2. **Node.js** installed (v18+)
3. **Dependencies** installed: `npm install`

### Running Tests

```bash
# Run all integration tests
npm run test:e2e

# Run with coverage
npm run test:e2e -- --coverage

# Run specific test suite
npm run test:e2e -- --testNamePattern="Company Registration"

# Run in watch mode
npm run test:e2e -- --watch

# Verbose output
npm run test:e2e -- --verbose
```

---

## 📊 Test Coverage

### Test Suites

1. **Health Check** (1 test)
   - ✅ GET /api/health

2. **Company Registration & Management** (6 tests)
   - ✅ POST /api/companies - Register new company
   - ✅ POST /api/companies - Duplicate email validation
   - ✅ POST /api/companies - Invalid data validation
   - ✅ GET /api/companies/:id - Get company by ID
   - ✅ GET /api/companies/:id - 404 for non-existent
   - ✅ PATCH /api/companies/:id - Update company

3. **Employee Registration & Email Creation** (4 tests)
   - ✅ POST /api/employees - Register employee
   - ✅ POST /api/employees - Invalid company ID
   - ✅ POST /api/employees/create-email - Create email
   - ✅ POST /api/employees/create-email - Duplicate email

4. **Resource Management** (6 tests)
   - ✅ POST /api/resources/url - Add URL resource
   - ✅ POST /api/resources/url - Invalid URL validation
   - ✅ GET /api/companies/:companyId/resources - List resources
   - ✅ GET /api/companies/:companyId/resources - Filter by type
   - ✅ DELETE /api/resources/:id - Delete resource
   - ✅ DELETE /api/resources/:id - 404 for non-existent

5. **Conversation & Chat** (6 tests)
   - ✅ POST /api/conversations - Create conversation
   - ✅ POST /api/conversations - Invalid company ID
   - ✅ GET /api/companies/:companyId/conversations - List conversations
   - ✅ POST /api/conversations/:id/messages - Send message & get AI response
   - ✅ GET /api/conversations/:id/messages - Get messages
   - ✅ POST /api/conversations/:id/messages - Empty content validation
   - ✅ POST /api/conversations/:id/messages - Non-existent conversation

6. **Pagination & Filtering** (2 tests)
   - ✅ Limit parameter support
   - ✅ Skip parameter support

7. **Error Handling** (4 tests)
   - ✅ 404 for non-existent endpoints
   - ✅ 400 for invalid MongoDB ObjectId
   - ✅ Required fields validation
   - ✅ Unknown fields rejection (forbidNonWhitelisted)

8. **Data Integrity** (3 tests)
   - ✅ No password in responses
   - ✅ ObjectId conversion
   - ✅ Unique constraints enforcement

**Total: ~32 integration tests**

---

## 🔄 Test Flow

### Complete User Journey

```
1. Register Company
   ↓
2. Get Company Details
   ↓
3. Update Company Info
   ↓
4. Register Employee
   ↓
5. Create Employee Email
   ↓
6. Add URL Resource
   ↓
7. List Resources
   ↓
8. Create Conversation
   ↓
9. Send Message (AI responds)
   ↓
10. Get Messages
    ↓
11. Delete Resource
```

Each step validates:
- ✅ Correct status codes
- ✅ Response structure
- ✅ Data integrity
- ✅ Relationships between entities

---

## 📝 Test Structure

### Test File Organization

```
back/
├── test/
│   ├── app.e2e-spec.ts       # Main integration tests
│   ├── jest-e2e.json          # Jest configuration
│   └── ...
├── .env.test                  # Test environment variables
└── package.json               # Test scripts
```

### Test Pattern

```typescript
describe('Feature Name', () => {
  it('should do something - success case', () => {
    return request(app.getHttpServer())
      .post('/api/endpoint')
      .send(data)
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('field', value);
      });
  });

  it('should fail with invalid data', () => {
    return request(app.getHttpServer())
      .post('/api/endpoint')
      .send(invalidData)
      .expect(400);
  });
});
```

---

## 🧩 Key Features

### 1. **Sequential Testing**
Tests run in order to simulate real user flow:
- Company → Employee → Resources → Chat

### 2. **Data Persistence**
IDs are stored and reused across tests:
```typescript
let companyId: string;
let employeeId: string;
let resourceId: string;
```

### 3. **Cleanup**
- Automatic cleanup after all tests
- Test database separate from development

### 4. **Realistic Data**
- Unique emails with timestamps
- Valid company/employee data
- Real-world scenarios

### 5. **Error Testing**
- Duplicate validation
- Invalid data rejection
- 404/400 error codes
- Constraint violations

---

## 🎯 Test Assertions

### Common Patterns

**Status Codes:**
```typescript
.expect(201)  // Created
.expect(200)  // OK
.expect(400)  // Bad Request
.expect(404)  // Not Found
.expect(409)  // Conflict
```

**Response Structure:**
```typescript
expect(res.body).toHaveProperty('_id');
expect(res.body).toHaveProperty('name', expectedName);
expect(res.body).not.toHaveProperty('password');
```

**Arrays:**
```typescript
expect(Array.isArray(res.body)).toBe(true);
expect(res.body.length).toBeGreaterThan(0);
```

**Relationships:**
```typescript
expect(res.body).toHaveProperty('companyId', companyId);
```

---

## 🛠️ Configuration

### Jest E2E Config (`test/jest-e2e.json`)

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "testTimeout": 30000
}
```

### Test Environment (`.env.test`)

```env
MONGODB_URI=mongodb://localhost:27017/onboard-ai-test
PORT=8001
NODE_ENV=test
JWT_SECRET=test-secret-key
```

---

## 📈 Coverage Goals

| Category | Target | Status |
|----------|--------|--------|
| Endpoints | 100% | ✅ |
| Success Cases | 100% | ✅ |
| Error Cases | 90%+ | ✅ |
| Validation | 100% | ✅ |
| Data Integrity | 100% | ✅ |

---

## 🐛 Debugging Tests

### Verbose Output
```bash
npm run test:e2e -- --verbose
```

### Single Test
```bash
npm run test:e2e -- --testNamePattern="should register a new company"
```

### Debug Mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Common Issues

**1. MongoDB Connection**
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Fix:** Start MongoDB
```bash
mongod
# or
docker run -d -p 27017:27017 mongo
```

**2. Port Already in Use**
```
Error: listen EADDRINUSE: address already in use :::8001
```
**Fix:** Change PORT in `.env.test` or stop other process

**3. Test Timeout**
```
Timeout - Async callback was not invoked within the 5000 ms timeout
```
**Fix:** Already configured to 30s in jest-e2e.json

---

## 🔍 Test Scenarios

### Happy Path
1. ✅ Complete company registration
2. ✅ Employee onboarding
3. ✅ Resource upload
4. ✅ AI chat interaction
5. ✅ Data retrieval

### Error Handling
1. ✅ Duplicate entries (409)
2. ✅ Invalid data (400)
3. ✅ Not found (404)
4. ✅ Validation failures
5. ✅ Constraint violations

### Edge Cases
1. ✅ Empty fields
2. ✅ Invalid ObjectIds
3. ✅ Non-existent references
4. ✅ Pagination limits
5. ✅ Unknown fields

---

## 📊 Example Test Output

```
OnboardAI API Integration Tests (e2e)
  Health Check
    ✓ /api/health (GET) - should return healthy status (45ms)
  Company Registration & Management
    ✓ /api/companies (POST) - should register a new company (123ms)
    ✓ /api/companies (POST) - should fail with duplicate email (67ms)
    ✓ /api/companies (POST) - should fail with invalid data (34ms)
    ✓ /api/companies/:id (GET) - should get company by id (56ms)
    ✓ /api/companies/:id (GET) - should return 404 for non-existent (23ms)
    ✓ /api/companies/:id (PATCH) - should update company (89ms)
  Employee Registration & Email Creation
    ✓ /api/employees (POST) - should register a new employee (134ms)
    ✓ /api/employees (POST) - should fail with invalid company ID (45ms)
    ✓ /api/employees/create-email (POST) - should create employee email (78ms)
    ✓ /api/employees/create-email (POST) - should fail with duplicate (34ms)
  ...

Test Suites: 1 passed, 1 total
Tests:       32 passed, 32 total
Time:        12.456 s
```

---

## 🚀 CI/CD Integration

### GitHub Actions Example

```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:latest
        ports:
          - 27017:27017
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
        working-directory: ./back
      
      - name: Run integration tests
        run: npm run test:e2e
        working-directory: ./back
        env:
          MONGODB_URI: mongodb://localhost:27017/test
```

---

## ✅ Best Practices

1. **Isolation**: Each test is independent
2. **Cleanup**: Database cleanup after tests
3. **Realistic Data**: Use real-world scenarios
4. **Error Testing**: Test failures as much as successes
5. **Documentation**: Clear test descriptions
6. **Fast Execution**: Parallel where possible
7. **Deterministic**: Same results every time

---

## 📚 Resources

- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Supertest](https://github.com/visionmedia/supertest)
- [Jest](https://jestjs.io/docs/getting-started)

---

## 🎯 Next Steps

1. ✅ Run tests: `npm run test:e2e`
2. ✅ Check coverage: `npm run test:e2e -- --coverage`
3. ✅ Add custom tests for your features
4. ✅ Integrate into CI/CD pipeline
5. ✅ Monitor test performance

---

**Happy Testing! 🧪✨**

