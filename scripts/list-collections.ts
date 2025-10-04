import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function listCollections() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/onboard-ai';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    // Get database name
    const dbName = uri.split('/').pop()?.split('?')[0] || 'onboard-ai';
    const db = client.db(dbName);

    console.log(`📊 Database: ${dbName}\n`);

    // List all collections
    const collections = await db.listCollections().toArray();

    console.log('📁 Collections:');
    console.log('═══════════════════════════════════════\n');

    if (collections.length === 0) {
      console.log('  No collections found.\n');
    } else {
      for (const collection of collections) {
        const collectionName = collection.name;
        const count = await db.collection(collectionName).countDocuments();
        console.log(`  📄 ${collectionName} (${count} documents)`);
      }
    }

    console.log('\n═══════════════════════════════════════\n');

    // Show sample documents from each collection
    console.log('📝 Sample Documents:\n');
    for (const collection of collections) {
      const collectionName = collection.name;
      const sampleDoc = await db.collection(collectionName).findOne();

      console.log(`\n${collectionName}:`);
      console.log(JSON.stringify(sampleDoc, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('\n✅ Connection closed');
  }
}

listCollections();
