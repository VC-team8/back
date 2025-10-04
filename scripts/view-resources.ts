import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function viewResources() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/onboard-ai';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const dbName = uri.split('/').pop()?.split('?')[0] || 'onboard-ai';
    const db = client.db(dbName);

    // View all resources
    const resources = await db.collection('resources').find().toArray();

    console.log(`📊 Total Resources: ${resources.length}\n`);
    console.log('═══════════════════════════════════════\n');

    if (resources.length === 0) {
      console.log('  No resources found.\n');
    } else {
      resources.forEach((resource, index) => {
        console.log(`\n[${index + 1}] ${resource.type.toUpperCase()}: ${resource.title}`);
        console.log(`    ID: ${resource._id}`);
        console.log(`    Company ID: ${resource.companyId}`);
        console.log(`    Tags: [${resource.tags?.join(', ') || ''}]`);
        if (resource.type === 'file') {
          console.log(`    File URL: ${resource.fileUrl}`);
        } else {
          console.log(`    URL: ${resource.url}`);
        }
        console.log(`    Created: ${resource.createdAt}`);
      });
    }

    console.log('\n═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('\n✅ Connection closed');
  }
}

viewResources();
