import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { MongoClient, Db } from 'mongodb';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private client: MongoClient;
  private db: Db;

  async onModuleInit() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/onboard-ai';
    this.client = new MongoClient(uri);
    await this.client.connect();

    // Extract database name from URI or use default
    const dbName = uri.split('/').pop()?.split('?')[0] || 'onboard-ai';
    this.db = this.client.db(dbName);

    console.log('✅ Connected to MongoDB Atlas');
  }

  async onModuleDestroy() {
    await this.client.close();
    console.log('❌ Disconnected from MongoDB Atlas');
  }

  getDb(): Db {
    return this.db;
  }

  getCollection<T = any>(name: string) {
    return this.db.collection<T>(name);
  }
}
