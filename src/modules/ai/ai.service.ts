import { Injectable, OnModuleInit } from '@nestjs/common';
import { ResourcesService } from '../resources/resources.service';
import { DatabaseService } from '../../database/database.service';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { ObjectId } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const SYSTEM_PROMPT = `You are OnboardAI, a friendly and professional assistant designed to help new employees get acquainted with their company. Your personality is helpful, clear, and concise.

You will be given a user's question and a context retrieved from the company's internal documents. Your task is to answer the user's question based *exclusively* on the provided context.

Follow these rules strictly:
1. Base your entire answer on the information found in the context. Do not use any external knowledge.
2. If the context does not contain the answer to the question, you must respond with: "I'm sorry, but I couldn't find information about that in the provided documents. You may want to ask your manager or HR for more details."
3. Answer in a direct and easy-to-understand manner.
4. Do not mention that you are retrieving information from a "context" or "documents". Just provide the answer as if you know it.`;

interface ResourceChunk {
  resourceId: ObjectId;
  companyId: ObjectId;
  chunkText: string;
  embedding: number[];
  createdAt: Date;
}

@Injectable()
export class AiService implements OnModuleInit {
  private anthropic: Anthropic;
  private openai: OpenAI;
  private chunksCollection;

  constructor(
    private resourcesService: ResourcesService,
    private databaseService: DatabaseService,
  ) {
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  onModuleInit() {
    this.chunksCollection = this.databaseService.getCollection<ResourceChunk>('resourceChunks');
  }

  /**
   * Processes an uploaded file, chunks it, creates embeddings, and stores them.
   */
  async processFile(resourceId: string): Promise<void> {
    console.log(`Processing file with resource ID: ${resourceId}`);

    const resource = await this.resourcesService.findOne(resourceId);
    if (!resource) {
      throw new Error('Resource not found');
    }

    // Only process file types
    if (resource.type !== 'file' || !resource.fileData) {
      throw new Error('Invalid resource type for file processing');
    }

    let content = '';
    const fileExtension = path.extname(resource.fileName).toLowerCase();

    // Handle different file types
    if (fileExtension === '.pdf') {
      // For PDFs, we need to write to temp file
      const tempFilePath = path.join(os.tmpdir(), `temp-${resourceId}.pdf`);

      try {
        // Write buffer to temp file
        fs.writeFileSync(tempFilePath, resource.fileData);

        // Load PDF
        const loader = new PDFLoader(tempFilePath);
        const docs = await loader.load();
        content = docs.map(doc => doc.pageContent).join('\n');
      } finally {
        // Clean up temp file
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
    } else if (fileExtension === '.md') {
      // For markdown, just convert buffer to string
      content = resource.fileData.toString('utf-8');
    } else {
      throw new Error(`Unsupported file type: ${fileExtension}. Only PDF and MD files are supported.`);
    }

    // Chunk the text
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 150,
    });
    const textChunks = await splitter.splitText(content);
    console.log(`Split content into ${textChunks.length} chunks.`);

    // Generate embeddings for each chunk
    const embeddings = await this.generateEmbeddings(textChunks);
    console.log(`Generated ${embeddings.length} embeddings.`);

    // Prepare documents for MongoDB
    const chunksToSave = textChunks.map((chunk, i) => ({
      resourceId: new ObjectId(resourceId),
      companyId: new ObjectId(resource.companyId),
      chunkText: chunk,
      embedding: embeddings[i],
      createdAt: new Date(),
    }));

    console.log(`Saving chunks with companyId: ${resource.companyId} (converted to ObjectId)`);

    // Save chunks to the database
    await this.chunksCollection.insertMany(chunksToSave);
    console.log('Successfully saved chunks and embeddings to MongoDB.');
  }

  async processUrl(resourceId: string): Promise<void> {
    // TODO: Implement URL processing logic
    console.log(`Processing URL with resource ID: ${resourceId}`);
  }

  /**
   * Handles a user's query by finding relevant context and generating a response.
   */
  async generateResponse(query: string, companyId: string): Promise<{ content: string; sources: any[] }> {
    console.log(`Generating AI response for query: "${query}" for company: ${companyId}`);

    // Generate an embedding for the user's query
    const queryEmbedding = (await this.generateEmbeddings([query]))[0];
    console.log(`Generated query embedding with ${queryEmbedding.length} dimensions`);

    // Find relevant document chunks using Atlas Vector Search
    const relevantChunks = await this.findRelevantChunks(queryEmbedding, companyId);
    console.log(`Vector search returned ${relevantChunks.length} chunks`);

    if (relevantChunks.length === 0) {
      // Debug: Check if there are any chunks for this company
      const totalChunks = await this.chunksCollection.countDocuments({ companyId: new ObjectId(companyId) });
      console.log(`Total chunks in database for company ${companyId}: ${totalChunks}`);

      return {
        content: "I'm sorry, but I couldn't find any relevant information in the company documents to answer your question.",
        sources: [],
      };
    }

    console.log(`Top chunk scores: ${relevantChunks.map(c => c.score).join(', ')}`);
    const context = relevantChunks.map(chunk => chunk.chunkText).join('\n\n---\n\n');

    // Fetch resource details for each unique resourceId
    const uniqueResourceIds = [...new Set(relevantChunks.map(chunk => chunk.resourceId.toString()))];
    const resourcesCollection = this.databaseService.getCollection('resources');
    const resources = await resourcesCollection.find({
      _id: { $in: uniqueResourceIds.map(id => new ObjectId(id)) }
    }).toArray();

    // Create a map for quick lookup
    const resourceMap = new Map(resources.map(r => [r._id.toString(), r]));

    // Generate the final answer with Claude 4.5
    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514', // Claude 4.5 Sonnet
        system: SYSTEM_PROMPT,
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: `Context: ${context}\n\nQuestion: ${query}`,
          },
        ],
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';

      return {
        content,
        sources: relevantChunks.map(chunk => {
          const resource = resourceMap.get(chunk.resourceId.toString());
          return {
            score: chunk.score,
            text: chunk.chunkText.substring(0, 200) + '...',
            resourceId: chunk.resourceId.toString(),
            resource: resource ? {
              id: resource._id.toString(),
              type: resource.type,
              title: resource.title,
              fileName: resource.fileName,
              fileUrl: resource.fileUrl,
              url: resource.url,
            } : null,
          };
        }),
      };
    } catch (error) {
      console.error('Error calling Anthropic API:', error);
      throw new Error('Failed to generate AI response.');
    }
  }

  /**
   * Generate embeddings using OpenAI's text-embedding-3-small model
   */
  private async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
    });
    return response.data.map(item => item.embedding);
  }

  /**
   * Uses MongoDB Atlas Vector Search to find relevant chunks
   */
  private async findRelevantChunks(queryEmbedding: number[], companyId: string) {
    console.log(`[Vector Search] Searching for company: ${companyId}`);
    console.log(`[Vector Search] Query vector dimensions: ${queryEmbedding.length}`);

    const pipeline = [
      {
        $vectorSearch: {
          index: 'vector_index_onboardai',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: 150,
          limit: 5,
          filter: {
            companyId: new ObjectId(companyId),
          },
        },
      },
      {
        $project: {
          _id: 0,
          chunkText: 1,
          score: { $meta: 'vectorSearchScore' },
          companyId: 1,
          resourceId: 1,
        },
      },
    ];

    console.log(`[Vector Search] Running aggregation pipeline...`);
    const results = await this.chunksCollection.aggregate(pipeline).toArray();
    console.log(`[Vector Search] Raw results count: ${results.length}`);

    if (results.length > 0) {
      console.log(`[Vector Search] First result company: ${results[0].companyId}, score: ${results[0].score}`);
      console.log(`[Vector Search] First result preview: ${results[0].chunkText.substring(0, 100)}...`);
    }

    return results;
  }

  async getStatus(): Promise<{ status: string; message: string }> {
    try {
      // Check if API keys are configured
      const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
      const hasOpenAIKey = !!process.env.OPENAI_API_KEY;

      if (!hasAnthropicKey || !hasOpenAIKey) {
        return {
          status: 'misconfigured',
          message: 'AI service requires both ANTHROPIC_API_KEY and OPENAI_API_KEY',
        };
      }

      return {
        status: 'operational',
        message: 'AI service is ready (Claude 4.5 + OpenAI Embeddings)',
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
      };
    }
  }
}

