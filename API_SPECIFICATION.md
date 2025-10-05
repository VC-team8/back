# 📋 Backend API Specification

## Base URL
```
http://localhost:8000/api
```

---

# 🏢 Companies (Організації)

## 1. Register Company (Реєстрація компанії)
```http
POST /companies
```

### Request Body
```json
{
  "name": "TechCorp Inc.",
  "industry": "technology",
  "size": "1-10",
  "contactName": "John Doe",
  "email": "john@techcorp.com",
  "password": "securePassword123"
}
```

### Validation Rules
- `name`: string, required, min 2 chars
- `industry`: string, required, one of: `technology`, `healthcare`, `finance`, `education`, `retail`, `manufacturing`, `other`
- `size`: string, required, one of: `1-10`, `11-50`, `51-200`, `201-500`, `500+`
- `contactName`: string, required, min 2 chars
- `email`: string, required, valid email format
- `password`: string, required, min 6 chars

### Response (201 Created)
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "id": "507f1f77bcf86cd799439011",
  "name": "TechCorp Inc.",
  "industry": "technology",
  "size": "1-10",
  "contactName": "John Doe",
  "email": "john@techcorp.com",
  "createdAt": "2025-10-04T12:00:00.000Z",
  "updatedAt": "2025-10-04T12:00:00.000Z"
}
```

### Error Responses
```json
// 400 Bad Request
{
  "statusCode": 400,
  "message": ["email must be a valid email", "password must be at least 6 characters"],
  "error": "Bad Request"
}

// 409 Conflict
{
  "statusCode": 409,
  "message": "Company with this email already exists",
  "error": "Conflict"
}
```

---

## 2. Get Company by ID
```http
GET /companies/:id
```

### URL Parameters
- `id`: MongoDB ObjectId

### Response (200 OK)
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "id": "507f1f77bcf86cd799439011",
  "name": "TechCorp Inc.",
  "industry": "technology",
  "size": "1-10",
  "contactName": "John Doe",
  "email": "john@techcorp.com",
  "createdAt": "2025-10-04T12:00:00.000Z",
  "updatedAt": "2025-10-04T12:00:00.000Z"
}
```

### Error Responses
```json
// 404 Not Found
{
  "statusCode": 404,
  "message": "Company not found",
  "error": "Not Found"
}
```

---

## 3. Update Company
```http
PATCH /companies/:id
```

### URL Parameters
- `id`: MongoDB ObjectId

### Request Body (all fields optional)
```json
{
  "name": "Updated TechCorp Inc.",
  "industry": "healthcare",
  "size": "11-50",
  "contactName": "Jane Doe",
  "email": "jane@techcorp.com"
}
```

### Response (200 OK)
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "id": "507f1f77bcf86cd799439011",
  "name": "Updated TechCorp Inc.",
  "industry": "healthcare",
  "size": "11-50",
  "contactName": "Jane Doe",
  "email": "jane@techcorp.com",
  "createdAt": "2025-10-04T12:00:00.000Z",
  "updatedAt": "2025-10-04T12:30:00.000Z"
}
```

---

# 👥 Employees (Співробітники)

## 4. Register Employee
```http
POST /employees
```

### Request Body
```json
{
  "name": "Alice Smith",
  "email": "alice@techcorp.com",
  "password": "employeePass123",
  "companyId": "507f1f77bcf86cd799439011",
  "department": "engineering",
  "tags": {
    "roles": ["developer", "team-lead"],
    "skills": ["javascript", "react", "node.js"],
    "interests": ["ai", "web-development"]
  }
}
```

### Validation Rules
- `name`: string, required, min 2 chars
- `email`: string, required, valid email format
- `password`: string, required, min 6 chars
- `companyId`: string, required, valid MongoDB ObjectId
- `department`: string, required, one of: `engineering`, `marketing`, `sales`, `hr`, `finance`, `operations`, `other`
- `tags`: object, optional
  - `roles`: array of strings
  - `skills`: array of strings
  - `interests`: array of strings

### Response (201 Created)
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "id": "507f1f77bcf86cd799439012",
  "name": "Alice Smith",
  "email": "alice@techcorp.com",
  "companyId": "507f1f77bcf86cd799439011",
  "department": "engineering",
  "tags": {
    "roles": ["developer", "team-lead"],
    "skills": ["javascript", "react", "node.js"],
    "interests": ["ai", "web-development"]
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "createdAt": "2025-10-04T12:00:00.000Z"
}
```

### Error Responses
```json
// 400 Bad Request
{
  "statusCode": 400,
  "message": ["email must be a valid email"],
  "error": "Bad Request"
}

// 404 Not Found
{
  "statusCode": 404,
  "message": "Company not found",
  "error": "Not Found"
}

// 409 Conflict
{
  "statusCode": 409,
  "message": "Employee with this email already exists",
  "error": "Conflict"
}
```

---

## 5. Create Employee Email (Corporate Email)
```http
POST /employees/create-email
```

### Request Body
```json
{
  "companyId": "507f1f77bcf86cd799439011",
  "email": "bob@company.com",
  "password": "AutoGenPass123!@#"
}
```

### Validation Rules
- `companyId`: string, required, valid MongoDB ObjectId
- `email`: string, required, valid email format
- `password`: string, required, min 8 chars (auto-generated on frontend)

### Response (201 Created)
```json
{
  "_id": "507f1f77bcf86cd799439013",
  "id": "507f1f77bcf86cd799439013",
  "companyId": "507f1f77bcf86cd799439011",
  "email": "bob@company.com",
  "password": "AutoGenPass123!@#",
  "createdAt": "2025-10-04T12:00:00.000Z"
}
```

### Notes
- Password is stored in plain text (for dashboard display)
- This is for creating corporate email accounts that will be given to employees

---

# 📚 Resources (Ресурси)

## 6. Upload File
```http
POST /resources/upload
```

### Request (multipart/form-data)
```
Content-Type: multipart/form-data

file: [binary file data]
companyId: "507f1f77bcf86cd799439011"
```

### Validation Rules
- `file`: required, max size 10MB
- Allowed file types: `.pdf`, `.doc`, `.docx`, `.txt`, `.md`, `.csv`, `.xls`, `.xlsx`
- `companyId`: string, required, valid MongoDB ObjectId

### Response (201 Created)
```json
{
  "_id": "507f1f77bcf86cd799439014",
  "id": "507f1f77bcf86cd799439014",
  "companyId": "507f1f77bcf86cd799439011",
  "type": "file",
  "title": "Employee_Handbook.pdf",
  "fileUrl": "/uploads/1696444800000-Employee_Handbook.pdf",
  "filePath": "uploads/1696444800000-Employee_Handbook.pdf",
  "fileSize": 2048576,
  "mimeType": "application/pdf",
  "processed": false,
  "createdAt": "2025-10-04T12:00:00.000Z",
  "updatedAt": "2025-10-04T12:00:00.000Z"
}
```

### Error Responses
```json
// 400 Bad Request
{
  "statusCode": 400,
  "message": "Invalid file type. Allowed: pdf, doc, docx, txt, md, csv, xls, xlsx",
  "error": "Bad Request"
}

// 413 Payload Too Large
{
  "statusCode": 413,
  "message": "File size exceeds 10MB limit",
  "error": "Payload Too Large"
}
```

---

## 7. Add URL Resource
```http
POST /resources/url
```

### Request Body
```json
{
  "companyId": "507f1f77bcf86cd799439011",
  "url": "https://company-wiki.com/onboarding",
  "title": "Company Wiki - Onboarding"
}
```

### Validation Rules
- `companyId`: string, required, valid MongoDB ObjectId
- `url`: string, required, valid URL format
- `title`: string, optional (if not provided, extracted from URL or page title)

### Response (201 Created)
```json
{
  "_id": "507f1f77bcf86cd799439015",
  "id": "507f1f77bcf86cd799439015",
  "companyId": "507f1f77bcf86cd799439011",
  "type": "url",
  "title": "Company Wiki - Onboarding",
  "url": "https://company-wiki.com/onboarding",
  "processed": false,
  "createdAt": "2025-10-04T12:00:00.000Z",
  "updatedAt": "2025-10-04T12:00:00.000Z"
}
```

---

## 8. List Company Resources
```http
GET /companies/:companyId/resources
```

### URL Parameters
- `companyId`: MongoDB ObjectId

### Query Parameters (optional)
- `type`: filter by type (`file` or `url`)
- `limit`: number of results (default: 50)
- `skip`: pagination offset (default: 0)

### Response (200 OK)
```json
[
  {
    "_id": "507f1f77bcf86cd799439014",
    "id": "507f1f77bcf86cd799439014",
    "companyId": "507f1f77bcf86cd799439011",
    "type": "file",
    "title": "Employee_Handbook.pdf",
    "fileUrl": "/uploads/1696444800000-Employee_Handbook.pdf",
    "fileSize": 2048576,
    "mimeType": "application/pdf",
    "processed": true,
    "createdAt": "2025-10-04T12:00:00.000Z"
  },
  {
    "_id": "507f1f77bcf86cd799439015",
    "id": "507f1f77bcf86cd799439015",
    "companyId": "507f1f77bcf86cd799439011",
    "type": "url",
    "title": "Company Wiki - Onboarding",
    "url": "https://company-wiki.com/onboarding",
    "processed": true,
    "createdAt": "2025-10-04T12:05:00.000Z"
  }
]
```

---

## 9. Delete Resource
```http
DELETE /resources/:id
```

### URL Parameters
- `id`: MongoDB ObjectId

### Response (200 OK)
```json
{
  "message": "Resource deleted successfully"
}
```

### Notes
- If resource is a file, the file should also be deleted from disk

---

# 💬 Conversations (Розмови)

## 10. Create Conversation
```http
POST /conversations
```

### Request Body
```json
{
  "companyId": "507f1f77bcf86cd799439011"
}
```

### Validation Rules
- `companyId`: string, required, valid MongoDB ObjectId

### Response (201 Created)
```json
{
  "_id": "507f1f77bcf86cd799439016",
  "id": "507f1f77bcf86cd799439016",
  "companyId": "507f1f77bcf86cd799439011",
  "title": null,
  "createdAt": "2025-10-04T12:00:00.000Z",
  "updatedAt": "2025-10-04T12:00:00.000Z"
}
```

---

## 11. List Company Conversations
```http
GET /companies/:companyId/conversations
```

### URL Parameters
- `companyId`: MongoDB ObjectId

### Query Parameters (optional)
- `limit`: number of results (default: 50)
- `skip`: pagination offset (default: 0)

### Response (200 OK)
```json
[
  {
    "_id": "507f1f77bcf86cd799439016",
    "id": "507f1f77bcf86cd799439016",
    "companyId": "507f1f77bcf86cd799439011",
    "title": "What are the company's core values?",
    "createdAt": "2025-10-04T12:00:00.000Z",
    "updatedAt": "2025-10-04T12:05:00.000Z"
  }
]
```

---

## 12. Get Conversation Messages
```http
GET /conversations/:conversationId/messages
```

### URL Parameters
- `conversationId`: MongoDB ObjectId

### Query Parameters (optional)
- `limit`: number of results (default: 100)
- `skip`: pagination offset (default: 0)

### Response (200 OK)
```json
[
  {
    "_id": "507f1f77bcf86cd799439017",
    "id": "507f1f77bcf86cd799439017",
    "conversationId": "507f1f77bcf86cd799439016",
    "role": "user",
    "content": "What are the company's core values?",
    "createdAt": "2025-10-04T12:00:00.000Z"
  },
  {
    "_id": "507f1f77bcf86cd799439018",
    "id": "507f1f77bcf86cd799439018",
    "conversationId": "507f1f77bcf86cd799439016",
    "role": "assistant",
    "content": "Based on the company handbook, our core values are: Innovation, Integrity, Collaboration, and Customer Focus.",
    "sources": [
      {
        "type": "file",
        "title": "Employee_Handbook.pdf",
        "url": "/uploads/1696444800000-Employee_Handbook.pdf",
        "excerpt": "Our core values guide everything we do: Innovation - we embrace new ideas..."
      }
    ],
    "createdAt": "2025-10-04T12:00:05.000Z"
  }
]
```

---

## 13. Send Message (AI Chat)
```http
POST /conversations/:conversationId/messages
```

### URL Parameters
- `conversationId`: MongoDB ObjectId

### Request Body
```json
{
  "content": "What are the company's core values?"
}
```

### Validation Rules
- `content`: string, required, min 1 char, max 5000 chars

### Response (201 Created)
```json
{
  "_id": "507f1f77bcf86cd799439018",
  "id": "507f1f77bcf86cd799439018",
  "conversationId": "507f1f77bcf86cd799439016",
  "role": "assistant",
  "content": "Based on the company handbook, our core values are: Innovation, Integrity, Collaboration, and Customer Focus.",
  "sources": [
    {
      "type": "file",
      "title": "Employee_Handbook.pdf",
      "url": "/uploads/1696444800000-Employee_Handbook.pdf",
      "excerpt": "Our core values guide everything we do: Innovation - we embrace new ideas..."
    }
  ],
  "createdAt": "2025-10-04T12:00:05.000Z"
}
```

### Process Flow
1. Save user message to database
2. Retrieve relevant resources (RAG - Retrieval Augmented Generation)
3. Send context + user message to AI (OpenAI/Anthropic)
4. Save AI response with sources to database
5. Return AI response

### Notes
- AI should use company's uploaded resources (files/URLs) as context
- Response should include source citations
- If conversation title is empty, generate from first message

---

# 🏥 Health Check

## 14. Health Check
```http
GET /health
```

### Response (200 OK)
```json
{
  "status": "healthy",
  "timestamp": "2025-10-04T12:00:00.000Z",
  "mongodb": "connected"
}
```

---

# 🔐 Authentication (Future)

**Note:** Currently not implemented on frontend, but should be added:

## 15. Company Login
```http
POST /auth/company/login
```

### Request Body
```json
{
  "email": "john@techcorp.com",
  "password": "securePassword123"
}
```

### Response (200 OK)
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "company": {
    "id": "507f1f77bcf86cd799439011",
    "name": "TechCorp Inc.",
    "email": "john@techcorp.com"
  }
}
```

---

## 16. Employee Login
```http
POST /auth/employee/login
```

### Request Body
```json
{
  "email": "alice@techcorp.com",
  "password": "employeePass123"
}
```

### Response (200 OK)
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "employee": {
    "id": "507f1f77bcf86cd799439012",
    "name": "Alice Smith",
    "email": "alice@techcorp.com",
    "companyId": "507f1f77bcf86cd799439011"
  }
}
```

---

# 📊 Summary of Endpoints

## Companies
- ✅ `POST /companies` - Register company
- ✅ `GET /companies/:id` - Get company
- ✅ `PATCH /companies/:id` - Update company

## Employees
- ✅ `POST /employees` - Register employee
- ✅ `POST /employees/create-email` - Create corporate email

## Resources
- ✅ `POST /resources/upload` - Upload file
- ✅ `POST /resources/url` - Add URL
- ✅ `GET /companies/:companyId/resources` - List resources
- ✅ `DELETE /resources/:id` - Delete resource

## Chat
- ✅ `POST /conversations` - Create conversation
- ✅ `GET /companies/:companyId/conversations` - List conversations
- ✅ `GET /conversations/:conversationId/messages` - Get messages
- ✅ `POST /conversations/:conversationId/messages` - Send message (AI)

## System
- ✅ `GET /health` - Health check

## Authentication (TODO)
- 🔜 `POST /auth/company/login` - Company login
- 🔜 `POST /auth/employee/login` - Employee login

---

# 🛠️ Technical Requirements

## CORS
```typescript
app.enableCors({
  origin: 'http://localhost:3000',
  credentials: true,
})
```

## Global Prefix
```typescript
app.setGlobalPrefix('api')
```

## Validation Pipe
```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}))
```

## File Upload Settings
- Max file size: 10MB
- Upload directory: `./uploads`
- Allowed extensions: pdf, doc, docx, txt, md, csv, xls, xlsx

## Database
- MongoDB with Mongoose
- Collections: `companies`, `employees`, `employee_emails`, `resources`, `conversations`, `messages`

## Environment Variables
```env
MONGODB_URI=mongodb://localhost:27017/onboard-ai
PORT=8000
NODE_ENV=development
JWT_SECRET=your-secret-key
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
OPENAI_API_KEY=sk-... (for AI chat)
ANTHROPIC_API_KEY=sk-ant-... (for Claude 4.5)
REDIS_URL=redis://localhost:6379 (for caching)
```

---

# 📖 Response ID Format

All responses should include both `_id` (MongoDB format) and `id` (frontend-friendly):

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "id": "507f1f77bcf86cd799439011",
  ...
}
```

Or use a transform to automatically convert `_id` to `id` in responses.

---

# 🎯 Priority Implementation Order

1. ✅ **Health Check** - verify backend is running
2. ✅ **Companies** - register, get, update
3. ✅ **Employees** - register, create email
4. ✅ **Resources** - upload file, add URL, list, delete
5. ✅ **Conversations** - create, list
6. ✅ **Messages** - send, receive (with AI integration)
7. 🔜 **Authentication** - login, JWT tokens

---

# 📝 Notes for Implementation

1. **Password Security**: Hash passwords with bcrypt (rounds: 10)
2. **File Storage**: Use Multer for file uploads, store in `./uploads`
3. **AI Integration**: Use OpenAI API for chat completions
4. **RAG**: Implement vector search for relevant resource retrieval
5. **Error Handling**: Use NestJS exception filters
6. **Logging**: Log all API requests and errors
7. **Swagger**: Document all endpoints with `@ApiOperation`, `@ApiResponse`
8. **Testing**: Write unit tests for services, e2e tests for controllers

