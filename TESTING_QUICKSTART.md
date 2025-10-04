# 🚀 Testing Quick Start

## Run Tests in 3 Steps

### 1. Setup Environment

```bash
cd back
cp env.test.example .env.test
```

### 2. Start MongoDB

**Option A - Docker (recommended):**
```bash
docker run -d -p 27017:27017 --name mongodb-test mongo:latest
```

**Option B - Local MongoDB:**
```bash
mongod
```

### 3. Run Tests

```bash
npm run test:e2e
```

---

## ✅ Expected Output

```
OnboardAI API Integration Tests (e2e)
  Health Check
    ✓ /api/health (GET) - should return healthy status
  Company Registration & Management
    ✓ /api/companies (POST) - should register a new company
    ✓ /api/companies (POST) - should fail with duplicate email
    ✓ /api/companies (POST) - should fail with invalid data
    ✓ /api/companies/:id (GET) - should get company by id
    ✓ /api/companies/:id (GET) - should return 404
    ✓ /api/companies/:id (PATCH) - should update company
  Employee Registration & Email Creation
    ✓ /api/employees (POST) - should register a new employee
    ✓ /api/employees (POST) - should fail with invalid company ID
    ✓ /api/employees/create-email (POST) - should create employee email
    ✓ /api/employees/create-email (POST) - should fail with duplicate
  Resource Management
    ✓ /api/resources/url (POST) - should add URL resource
    ✓ /api/resources/url (POST) - should fail with invalid URL
    ✓ /api/companies/:companyId/resources (GET) - should list resources
    ✓ /api/companies/:companyId/resources (GET) - should filter by type
    ✓ /api/resources/:id (DELETE) - should delete resource
    ✓ /api/resources/:id (DELETE) - should return 404
  Conversation & Chat
    ✓ /api/conversations (POST) - should create a new conversation
    ✓ /api/conversations (POST) - should fail with invalid company ID
    ✓ /api/companies/:companyId/conversations (GET) - should list conversations
    ✓ /api/conversations/:id/messages (POST) - send message & get AI response
    ✓ /api/conversations/:id/messages (GET) - should get messages
    ✓ /api/conversations/:id/messages (POST) - should fail with empty content
    ✓ /api/conversations/:id/messages (POST) - should fail with non-existent
  Pagination & Filtering
    ✓ should support limit parameter
    ✓ should support skip parameter
  Error Handling
    ✓ should return 404 for non-existent endpoints
    ✓ should return 400 for invalid MongoDB ObjectId
    ✓ should validate required fields
    ✓ should reject unknown fields
  Data Integrity
    ✓ should not expose sensitive data in responses
    ✓ should properly handle MongoDB ObjectId conversion
    ✓ should enforce unique constraints

Test Suites: 1 passed, 1 total
Tests:       32 passed, 32 total
Time:        12.456 s
```

---

## 📊 Test Coverage

Run with coverage report:

```bash
npm run test:e2e -- --coverage
```

---

## 🐛 Troubleshooting

### MongoDB Not Running
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Fix:** Start MongoDB (see step 2 above)

### Port Already in Use
```
Error: listen EADDRINUSE :::8001
```
**Fix:** Change PORT in `.env.test` or kill process on port 8001

### Tests Timeout
```
Timeout - Async callback was not invoked
```
**Fix:** Tests are configured for 30s timeout. Check MongoDB connection.

---

## 🎯 Run Specific Tests

```bash
# Run only Company tests
npm run test:e2e -- --testNamePattern="Company"

# Run only one specific test
npm run test:e2e -- --testNamePattern="should register a new company"

# Verbose output
npm run test:e2e -- --verbose

# Watch mode
npm run test:e2e -- --watch
```

---

## 📚 More Info

See [TEST_README.md](./TEST_README.md) for complete documentation.

---

**That's it! Happy Testing! 🎉**

