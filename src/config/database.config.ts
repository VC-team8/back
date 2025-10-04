import { MongooseModule } from '@nestjs/mongoose';

export const databaseConfig = MongooseModule.forRoot(
  process.env.MONGODB_URI || 'mongodb://localhost:27017/onboard-ai',
);
