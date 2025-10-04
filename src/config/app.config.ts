export const appConfig = {
  port: parseInt(process.env.PORT, 10) || 8000,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10485760, // 10MB
  uploadPath: process.env.UPLOAD_PATH || './uploads',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
};

