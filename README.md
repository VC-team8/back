# OnboardAI Backend

Backend API for AI-powered employee onboarding platform built with Nest.js, TypeScript, and MongoDB.

## Features

- **Company Management**: Register and manage companies
- **Resource Management**: Upload files and add URLs for onboarding materials
- **Chat System**: AI-powered conversations for employee onboarding
- **File Processing**: Support for PDF, DOC, DOCX, TXT, and MD files
- **RESTful API**: Well-documented endpoints with Swagger
- **Validation**: Input validation and error handling
- **CORS Support**: Cross-origin resource sharing for frontend integration

## Tech Stack

- **Framework**: Nest.js
- **Language**: TypeScript
- **Database**: MongoDB Atlas (native driver)
- **Documentation**: Swagger/OpenAPI
- **File Upload**: Multer
- **Validation**: class-validator, class-transformer

## Installation

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:

Create a `.env` file with your MongoDB Atlas connection string:

```env
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/onboard-ai?retryWrites=true&w=majority

# Server
PORT=8000
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:3000

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# AI Integration (optional)
OPENAI_API_KEY=
```

3. Run the application:
```bash
# Development
pnpm run start:dev

# Production
pnpm run build
pnpm run start:prod
```

## API Documentation

Once the server is running, visit:
- **API Docs**: http://localhost:8000/api/docs
- **Health Check**: http://localhost:8000/api/health

## API Endpoints

### Companies
- `POST /api/companies` - Create company
- `GET /api/companies` - Get all companies
- `GET /api/companies/:id` - Get company by ID
- `PATCH /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company

### Resources
- `POST /api/resources` - Create resource
- `POST /api/resources/upload` - Upload file
- `POST /api/resources/url` - Add URL resource
- `GET /api/resources/companies/:companyId` - Get resources by company
- `GET /api/resources/:id` - Get resource by ID
- `PATCH /api/resources/:id` - Update resource
- `DELETE /api/resources/:id` - Delete resource

### Conversations
- `POST /api/conversations` - Create conversation
- `GET /api/conversations/companies/:companyId` - Get conversations by company
- `GET /api/conversations/:id` - Get conversation by ID
- `PATCH /api/conversations/:id` - Update conversation
- `DELETE /api/conversations/:id` - Delete conversation

### Messages
- `POST /api/messages` - Create message
- `POST /api/messages/conversations/:conversationId/send` - Send message
- `GET /api/messages/conversations/:conversationId` - Get messages by conversation
- `GET /api/messages/:id` - Get message by ID
- `PATCH /api/messages/:id` - Update message
- `DELETE /api/messages/:id` - Delete message

### AI
- `POST /api/ai/process-file/:resourceId` - Process file for AI
- `POST /api/ai/process-url/:resourceId` - Process URL for AI
- `POST /api/ai/chat` - Generate AI response
- `POST /api/ai/status` - Get AI service status

### System
- `GET /api/health` - Health check
- `GET /api/stats` - API statistics

## Project Structure

```
src/
├── common/
│   ├── dto/           # Data Transfer Objects
│   └── interfaces/    # TypeScript interfaces
├── config/            # Configuration files
├── modules/           # Feature modules
│   ├── companies/     # Company management
│   ├── resources/     # Resource management
│   ├── conversations/ # Conversation management
│   ├── messages/      # Message management
│   └── ai/           # AI processing
├── app.module.ts      # Root module
├── app.service.ts     # Root service
├── app.controller.ts  # Root controller
└── main.ts           # Application entry point
```

## Development

### Available Scripts

- `npm run start` - Start the application
- `npm run start:dev` - Start in development mode with hot reload
- `npm run build` - Build the application
- `npm run test` - Run tests
- `npm run lint` - Run linting

### File Upload

The API supports file uploads with the following specifications:
- **Supported formats**: PDF, DOC, DOCX, TXT, MD
- **Maximum size**: 10MB (configurable)
- **Storage**: Local filesystem (configurable path)

### AI Integration

The AI module is designed to be easily extensible:
- Currently uses mock responses for development
- Ready for OpenAI API integration
- Supports file and URL content processing
- Generates responses with source attribution

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

