import { Injectable, OnModuleInit } from '@nestjs/common';
import { ResourcesService } from '../resources/resources.service';
import { DatabaseService } from '../../database/database.service';
import { CacheService } from '../cache/cache.service';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { ObjectId } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

const SYSTEM_PROMPT = `You are OnboardAI, a friendly and professional assistant designed to help new employees get acquainted with their company. Your personality is helpful, clear, and concise.

You will be given a user's question and context retrieved from the company's internal documents (files, web pages, documentation, etc.). Your task is to answer the user's question based on the provided context.

Follow these guidelines:
1. Analyze ALL provided context carefully to understand the overall theme and topics covered
2. Answer the user's question by synthesizing information across all relevant sources
3. If the user asks about a general topic (e.g., "what's in the Google Doc?", "tell me about X"), provide a comprehensive overview based on ALL available information
4. Focus on the MAIN CONTENT and KEY POINTS from the sources, not on UI elements or navigation text
5. When information is found, provide a detailed, helpful answer in your own words with specific examples
6. If the context doesn't contain relevant information, say: "I couldn't find information about that in the available documents. You may want to ask your manager or HR for more details."
7. Be conversational and natural - don't mention "context" or "chunks", just answer as if you're knowledgeable about the company
8. If you see repetitive or irrelevant content (like menu items, navigation), ignore it and focus on the substantive information

Remember: Your goal is to be helpful and informative based on what's actually IN the company's documents, not just matching keywords.`;

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
    private cacheService: CacheService,
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

  /**
   * Clean and structure scraped content into a proper document
   */
  private cleanAndStructureContent(rawText: string, url: string, title?: string): string {
    console.log('🧹 Cleaning and structuring content...');

    // Step 1: Remove excessive whitespace
    let cleaned = rawText
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n\s*\n+/g, '\n\n')
      .trim();

    // Step 2: Remove common UI patterns
    const uiPatterns = [
      /\([A-Z]\)\s/g, // (A), (B), (C) shortcuts
      /Ctrl\+[A-Z]/gi, // Keyboard shortcuts
      /Alt\+[\/A-Z]/gi,
      /Shift\+[A-Z]/gi,
      /\b[A-Z]{2,}\+[A-Z]{2,}\b/g, // CTRL+SHIFT etc
      /►\s*/g, // Menu arrows
      /\(\s*[A-Z]\s*\)/g, // Single letter shortcuts
    ];

    uiPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });

    // Step 3: Remove very short repeated phrases (likely UI elements)
    const lines = cleaned.split('\n');
    const uniqueLines = new Map<string, number>();
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.length > 0) {
        uniqueLines.set(trimmed, (uniqueLines.get(trimmed) || 0) + 1);
      }
    });

    // Keep only lines that appear once or twice (remove highly repetitive UI)
    const filteredLines = lines.filter(line => {
      const trimmed = line.trim();
      const count = uniqueLines.get(trimmed) || 0;
      // Keep substantial lines (>20 chars) or non-repetitive lines
      return trimmed.length > 20 || count <= 2;
    });

    // Step 4: Remove common navigation words when they appear alone
    const navWords = new Set([
      'створити', 'create', 'відкрити', 'open', 'зберегти', 'save',
      'поділитися', 'share', 'друк', 'print', 'копіювати', 'copy',
      'вирізати', 'cut', 'вставити', 'paste', 'вибрати', 'select',
      'налаштування', 'settings', 'довідка', 'help', 'пошук', 'search',
      'меню', 'menu', 'файл', 'file', 'редагувати', 'edit'
    ]);

    const meaningfulLines = filteredLines.filter(line => {
      const words = line.trim().toLowerCase().split(/\s+/);
      // If line is just 1-2 navigation words, skip it
      if (words.length <= 2 && words.every(w => navWords.has(w))) {
        return false;
      }
      return true;
    });

    // Step 5: Reconstruct document with structure
    let structured = meaningfulLines.join('\n');

    // Step 6: Format as document with title and metadata
    let documentHeader = '';
    if (title) {
      documentHeader += `# ${title}\n\n`;
    }
    documentHeader += `Document extracted from: ${url}\n`;
    documentHeader += `Extraction date: ${new Date().toISOString()}\n\n`;
    documentHeader += `---\n\n`;
    
    // Step 7: Final cleanup
    structured = structured
      .replace(/\n{3,}/g, '\n\n') // Max 2 newlines
      .replace(/\s+([.,!?])/g, '$1') // Fix punctuation spacing
      .trim();

    console.log(`✨ Content cleaned: ${rawText.length} → ${structured.length} characters`);
    console.log(`📊 Removed ${rawText.length - structured.length} characters (${Math.round((1 - structured.length / rawText.length) * 100)}% reduction)`);

    return documentHeader + structured;
  }

  /**
   * Scrapes web page content using optimal method based on URL type:
   * - Google Docs → export as text
   * - Notion/dynamic → Puppeteer
   * - Static pages → Cheerio
   */
  private async scrapeWebPage(url: string, title?: string): Promise<string> {
    console.log(`🔄 Scraping web page: ${url}`);

    let rawContent: string;
    
    // ✅ 1. Google Docs - use export URL (much faster and more reliable)
    if (url.includes('docs.google.com/document')) {
      console.log('📄 Detected Google Docs - using export URL...');
      rawContent = await this.scrapeGoogleDoc(url);
    }
    // ✅ 2. Notion or other dynamic sites - use Puppeteer
    else if (url.includes('notion.so') || url.includes('notion.site') || url.includes('webflow.io')) {
      console.log('📱 Using Puppeteer for dynamic content...');
      rawContent = await this.scrapeDynamicPage(url);
    }
    // ✅ 3. Static pages - use Cheerio (fastest)
    else {
      console.log('⚡ Using Cheerio for static content...');
      rawContent = await this.scrapeStaticPage(url);
    }

    // Clean and structure the content with title
    const cleanedContent = this.cleanAndStructureContent(rawContent, url, title);
    
    return cleanedContent;
  }

  /**
   * Scrapes Google Docs using export URL (much faster than Puppeteer)
   */
  private async scrapeGoogleDoc(url: string): Promise<string> {
    try {
      // Convert edit URL to export URL
      const exportUrl = url.replace(/\/edit.*$/, '/export?format=txt');
      console.log(`🔄 Exporting Google Doc as text: ${exportUrl}`);

      const response = await fetch(exportUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        redirect: 'follow',
      });

      if (!response.ok) {
        // Check if it's a permission error
        if (response.status === 403 || response.status === 401) {
          throw new Error('This Google Doc requires authentication or permission to access. Please make sure the document is publicly accessible (Anyone with the link → Viewer).');
        }
        throw new Error(`Failed to export Google Doc: HTTP ${response.status} ${response.statusText}`);
      }

      const text = await response.text();

      if (!text || text.trim().length < 20) {
        throw new Error('Google Doc content is empty or insufficient. The document may be empty or require authentication.');
      }

      console.log(`✅ Exported ${text.length} characters from Google Doc`);
      return text.trim();

    } catch (error) {
      console.error(`❌ Error exporting Google Doc:`, error);
      throw new Error(`Failed to export Google Doc: ${error.message}`);
    }
  }

  /**
   * Scrapes static pages using fetch + Cheerio (faster)
   */
  private async scrapeStaticPage(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Remove unwanted elements
      $('script, style, nav, header, footer, iframe, noscript').remove();

      // Extract main content (try common content containers first)
      const contentSelectors = [
        'main',
        'article',
        '.content',
        '.main-content',
        '#content',
        '[role="main"]',
        'body'
      ];

      let text = '';
      for (const selector of contentSelectors) {
        const element = $(selector);
        if (element.length > 0) {
          text = element.text();
          break;
        }
      }

      // Fallback to body if no specific content container found
      if (!text) {
        text = $('body').text();
      }

      // Clean up whitespace
      text = text
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim();

      console.log(`✅ Extracted ${text.length} characters from static page`);
      return text;
    } catch (error) {
      console.error(`❌ Error scraping static page:`, error);
      throw new Error(`Failed to scrape static page: ${error.message}`);
    }
  }

  /**
   * Scrapes dynamic pages (Notion, SPAs) using Puppeteer
   */
  private async scrapeDynamicPage(url: string): Promise<string> {
    let browser = null;
    try {
      console.log('🚀 Launching browser...');
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();
      
      // Set viewport and user agent
      await page.setViewport({ width: 1200, height: 800 });
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      console.log('🌐 Navigating to page...');
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 60000,
      });

      // Wait for content to load
      console.log('⏳ Waiting for content to load...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log('📄 Extracting content...');
      const content = await page.evaluate(() => {
        // Try to find main content area
        const article = document.querySelector('article, main, .notion-page-content, body') as HTMLElement;
        const text = article?.innerText || '';
        
        if (!text || text.trim().length < 10) {
          // Fallback to body.innerText
          return document.body?.innerText || '';
        }
        
        return text;
      });

      await browser.close();

      if (!content || content.trim().length < 20) {
        throw new Error('Page content is empty or unreadable. The page may be empty or require authentication.');
      }

      console.log(`✅ Extracted ${content.length} characters from dynamic page`);
      return content.trim();

    } catch (error) {
      if (browser) {
        await browser.close();
      }
      console.error(`❌ Error scraping dynamic page:`, error);
      throw new Error(`Puppeteer failed: ${error.message}`);
    }
  }

  /**
   * Processes a URL resource by scraping its content and creating embeddings
   */
  /**
   * Process URL as a virtual file - extract content and treat it like a document
   */
  async processUrl(resourceId: string): Promise<void> {
    console.log(`\n🔄 Processing URL as virtual document with resource ID: ${resourceId}`);
    
    try {
      // Fetch resource from database
      const resourcesCollection = this.databaseService.getCollection('resources');
      const resource = await resourcesCollection.findOne({ _id: new ObjectId(resourceId) });
      
      if (!resource || resource.type !== 'url' || !resource.url) {
        throw new Error('Invalid resource or missing URL');
      }

      console.log(`📍 URL: ${resource.url}`);
      console.log(`📋 Title: ${resource.title}`);
      console.log(`📄 Converting URL to virtual document...`);
      
      // Step 1: Scrape and clean content from URL (pass title for better context)
      const cleanedDocument = await this.scrapeWebPage(resource.url, resource.title);

      if (!cleanedDocument || cleanedDocument.length < 100) {
        throw new Error('Insufficient content extracted from URL');
      }

      console.log(`✅ Extracted and cleaned ${cleanedDocument.length} characters`);

      // Step 2: Create virtual filename and mimetype
      const virtualFileName = `${resource.title.replace(/[^a-zA-Z0-9-_]/g, '_')}_from_url.md`;
      const virtualMimeType = 'text/markdown';

      // Step 3: Save as virtual file in resource document
      await resourcesCollection.updateOne(
        { _id: new ObjectId(resourceId) },
        { 
          $set: { 
            extractedContent: cleanedDocument,
            extractedAt: new Date(),
            contentLength: cleanedDocument.length,
            // Store as virtual file
            fileName: virtualFileName,
            mimeType: virtualMimeType,
            fileSize: Buffer.byteLength(cleanedDocument, 'utf8'),
            // Keep original URL
            originalUrl: resource.url,
          } 
        }
      );
      console.log(`📦 Saved as virtual file: ${virtualFileName}`);

      // Step 4: Process exactly like a file would be processed
      await this.processAsFile(resourceId, cleanedDocument, resource.companyId);

      // Step 5: Update resource as processed
      await resourcesCollection.updateOne(
        { _id: new ObjectId(resourceId) },
        { $set: { processed: true, processedAt: new Date() } }
      );

      console.log(`✅ URL converted to virtual document and processed!\n`);

    } catch (error) {
      console.error(`\n❌ Error processing URL ${resourceId}:`, error.message);
      
      // Update resource with error status
      try {
        const resourcesCollection = this.databaseService.getCollection('resources');
        await resourcesCollection.updateOne(
          { _id: new ObjectId(resourceId) },
          { 
            $set: { 
              processed: false, 
              processingError: error.message,
              processedAt: new Date() 
            } 
          }
        );
      } catch (updateError) {
        console.error('Failed to update resource error status:', updateError);
      }
      
      throw error;
    }
  }

  /**
   * Process content as file (used by both file uploads and URL processing)
   */
  private async processAsFile(resourceId: string, content: string, companyId: any): Promise<void> {
    console.log(`📝 Processing content as document...`);

    // Split into chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const chunks = await splitter.splitText(content);
    console.log(`📦 Split into ${chunks.length} chunks`);

    // Generate embeddings
    console.log(`🧠 Generating embeddings...`);
    const embeddings = await this.generateEmbeddings(chunks);
    console.log(`✅ Generated ${embeddings.length} embeddings`);

    // Prepare documents for insertion
    const documents = chunks.map((chunk, index) => ({
      resourceId: new ObjectId(resourceId),
      companyId: new ObjectId(companyId),
      chunkIndex: index,
      chunkText: chunk,
      embedding: embeddings[index],
      createdAt: new Date(),
    }));

    // Insert into MongoDB
    console.log(`💾 Saving to database...`);
    await this.chunksCollection.insertMany(documents);
    console.log(`✅ Successfully indexed ${documents.length} chunks`);
  }

  /**
   * Handles a user's query by finding relevant context and generating a response.
   */
  async generateResponse(query: string, companyId: string): Promise<{ content: string; sources: any[] }> {
    console.log(`Generating AI response for query: "${query}" for company: ${companyId}`);

    // Track query frequency (async, non-blocking)
    this.cacheService.trackQuery(query, companyId).catch(err =>
      console.error('Error tracking query:', err)
    );

    // Check cache first
    const cachedResponse = await this.cacheService.getCachedResponse(query, companyId);
    if (cachedResponse) {
      console.log('Returning cached response');
      return {
        content: cachedResponse.content,
        sources: cachedResponse.sources,
      };
    }

    // Step 1: Expand query with related terms to improve recall
    const expandedQueries = await this.expandQuery(query);
    console.log(`Expanded query into ${expandedQueries.length} variations`);

    // Step 2: Generate embeddings for all query variations
    const queryEmbeddings = await this.generateEmbeddings(expandedQueries);
    console.log(`Generated ${queryEmbeddings.length} query embeddings`);

    // Step 3: Search with multiple embeddings and combine results
    const allChunks = new Map<string, any>(); // Use Map to deduplicate by chunk ID
    
    for (let i = 0; i < queryEmbeddings.length; i++) {
      const chunks = await this.findRelevantChunks(queryEmbeddings[i], companyId, 10); // Get more chunks per query
      chunks.forEach(chunk => {
        const chunkId = `${chunk.resourceId}-${chunk.chunkText.substring(0, 50)}`;
        if (!allChunks.has(chunkId) || allChunks.get(chunkId).score < chunk.score) {
          allChunks.set(chunkId, chunk);
        }
      });
    }

    // Sort by score and take top chunks
    const relevantChunks = Array.from(allChunks.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 15); // Increased from 5 to 15 for better context

    console.log(`Vector search returned ${relevantChunks.length} unique chunks from ${allChunks.size} total results`);

    if (relevantChunks.length === 0) {
      // Debug: Check if there are any chunks for this company
      const totalChunks = await this.chunksCollection.countDocuments({ companyId: new ObjectId(companyId) });
      console.log(`Total chunks in database for company ${companyId}: ${totalChunks}`);

      // Check if company has any resources at all
      const resourcesCollection = this.databaseService.getCollection('resources');
      const totalResources = await resourcesCollection.countDocuments({ companyId: new ObjectId(companyId) });

      if (totalResources === 0) {
        return {
          content: "I don't have any documents to search through yet. Please upload company documents or add resource URLs first, and then I'll be able to answer your questions based on that information.",
          sources: [],
        };
      } else if (totalChunks === 0) {
        return {
          content: "Your documents are still being processed. Please wait a moment and try again, or contact support if this issue persists.",
          sources: [],
        };
      } else {
        return {
          content: "I couldn't find specific information about that in your company documents. This might mean:\n\n- The information isn't in the uploaded documents\n- Try rephrasing your question\n- Consider uploading more relevant documents\n\nFeel free to ask another question or upload additional resources!",
          sources: [],
        };
      }
    }

    console.log(`Top chunk scores: ${relevantChunks.map(c => c.score).join(', ')}`);
    
    // Fetch resource details for each unique resourceId
    const uniqueResourceIds = [...new Set(relevantChunks.map(chunk => chunk.resourceId.toString()))] as string[];
    const resourcesCollection = this.databaseService.getCollection('resources');
    const resources = await resourcesCollection.find({
      _id: { $in: uniqueResourceIds.map(id => new ObjectId(id)) }
    }).toArray();

    // Create a map for quick lookup
    const resourceMap = new Map(resources.map(r => [r._id.toString(), r]));

    const context = relevantChunks.map(chunk => chunk.chunkText).join('\n\n---\n\n');

    // Generate the final answer with Claude 4.5
    try {
      // Get unique resource titles for better context
      const uniqueResources = Array.from(new Set(relevantChunks.map(c => c.resourceId.toString())));
      const resourceTitles = uniqueResources
        .map(id => {
          const resource = resourceMap.get(id);
          return resource ? `- ${resource.title} (${resource.type})` : '';
        })
        .filter(t => t)
        .join('\n');

      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514', // Claude 4.5 Sonnet
        system: SYSTEM_PROMPT,
        max_tokens: 2500, // Increased for comprehensive responses
        messages: [
          {
            role: 'user',
            content: `I have gathered information from ${uniqueResources.length} company resource(s):
${resourceTitles}

Here is the relevant content from these resources:

${context}

User's question: "${query}"

Please analyze ALL the provided content and give a comprehensive, helpful answer. Focus on:
1. The MAIN THEMES and KEY INFORMATION from the documents
2. Synthesizing information across multiple sources if available
3. Providing specific details and examples when relevant
4. Ignoring any UI elements, navigation text, or repetitive content
5. If the user asks "what's in X", provide an overview of the main topics and content

Answer in a natural, conversational way as if you're an expert on this company's documentation.`,
          },
        ],
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';

      // Deduplicate sources by resourceId to avoid showing same document multiple times
      const uniqueSources = new Map<string, any>();
      
      for (const chunk of relevantChunks) {
        const resourceId = chunk.resourceId.toString();
        const resource = resourceMap.get(resourceId);
        
        // Skip if we already have this resource or if resource not found
        if (!resource || uniqueSources.has(resourceId)) {
          continue;
        }
        
        uniqueSources.set(resourceId, {
          score: chunk.score,
          text: chunk.chunkText.substring(0, 200) + '...',
          resourceId: resourceId,
          resource: {
            id: resource._id.toString(),
            type: resource.type,
            title: resource.title,
            fileName: resource.fileName,
            fileUrl: resource.fileUrl,
            url: resource.url,
          },
        });
      }

      const result = {
        content,
        sources: Array.from(uniqueSources.values())
      };

      // Cache the response (async, non-blocking)
      this.cacheService.cacheResponse(query, companyId, result).catch(err =>
        console.error('Error caching response:', err)
      );

      return result;
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
   * Expand user query into multiple variations to improve search recall
   */
  private async expandQuery(query: string): Promise<string[]> {
    const queries = [query]; // Original query

    // Add variations for common question patterns
    const lowerQuery = query.toLowerCase();

    // If asking "what's in X", also search for the topic name
    if (lowerQuery.includes('what') || lowerQuery.includes('що')) {
      // Extract topic (e.g., "Google Doc", "Next.js", etc.)
      const topicMatch = query.match(/(?:про|about|in|у)\s+(.+?)(?:\?|$)/i);
      if (topicMatch) {
        queries.push(topicMatch[1].trim());
      }
    }

    // If asking about something, add "overview" and "introduction"
    if (lowerQuery.includes('tell me about') || lowerQuery.includes('розкажи')) {
      queries.push(`overview ${query}`);
      queries.push(`introduction ${query}`);
    }

    // Add related terms for common topics
    if (lowerQuery.includes('google doc') || lowerQuery.includes('гуглдок')) {
      queries.push('document content');
      queries.push('main topics');
    }

    if (lowerQuery.includes('next.js') || lowerQuery.includes('nextjs')) {
      queries.push('Next.js framework');
      queries.push('React framework');
      queries.push('web development');
    }

    // Deduplicate
    return [...new Set(queries)];
  }

  /**
   * Uses MongoDB Atlas Vector Search to find relevant chunks
   */
  private async findRelevantChunks(queryEmbedding: number[], companyId: string, limit: number = 5) {
    const pipeline = [
      {
        $vectorSearch: {
          index: 'vector_index_onboardai',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: 200, // Increased for better recall
          limit: limit,
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

    const results = await this.chunksCollection.aggregate(pipeline).toArray();
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

  /**
   * Generate personalized welcome message based on employee profile
   */
  async generateWelcomeMessage(data: {
    companyId: string;
    employeeName?: string;
    department?: string;
    tags?: {
      roles?: string[];
      skills?: string[];
      interests?: string[];
    };
  }): Promise<{ content: string; sources: any[] }> {
    console.log(`Generating personalized welcome message for company: ${data.companyId}`);

    // Build a query based on employee profile
    let query = 'Welcome! Give me a personalized introduction to the company';
    
    if (data.tags) {
      const { roles, skills, interests } = data.tags;
      const tagParts: string[] = [];
      
      if (roles && roles.length > 0) {
        tagParts.push(`my role is ${roles.join(', ')}`);
      }
      if (skills && skills.length > 0) {
        tagParts.push(`my skills include ${skills.join(', ')}`);
      }
      if (interests && interests.length > 0) {
        tagParts.push(`I'm interested in ${interests.join(', ')}`);
      }
      
      if (tagParts.length > 0) {
        query += `. Here's my profile: ${tagParts.join('; ')}.`;
      }
    }

    if (data.department) {
      query += ` I'm in the ${data.department} department.`;
    }

    query += ' Please provide relevant information, resources, and guidance specific to my profile.';

    console.log(`Welcome query: ${query}`);

    // Use the standard generateResponse method with custom system prompt
    const WELCOME_SYSTEM_PROMPT = `You are OnboardAI, a friendly and professional onboarding assistant. You are welcoming a new employee to the company.

Your task is to provide a warm, personalized welcome message that:
1. Greets the employee warmly
2. Provides an overview of key information relevant to their role, skills, and interests
3. Highlights the most important resources and documents they should review
4. Offers guidance on what they should focus on during their first days
5. Maintains an encouraging and supportive tone

Use the provided context from company documents to give specific, actionable information. Make the welcome message concise but informative (aim for 3-5 paragraphs).`;

    // Temporarily override system prompt
    const originalSystemPrompt = SYSTEM_PROMPT;
    
    try {
      // Generate embeddings for the welcome query
      const expandedQueries = await this.expandQuery(query);
      const queryEmbeddings = await this.generateEmbeddings(expandedQueries);

      // Search with multiple embeddings
      const allChunks = new Map<string, any>();
      
      for (let i = 0; i < queryEmbeddings.length; i++) {
        const chunks = await this.findRelevantChunks(queryEmbeddings[i], data.companyId, 10);
        chunks.forEach(chunk => {
          const chunkId = `${chunk.resourceId}-${chunk.chunkText.substring(0, 50)}`;
          if (!allChunks.has(chunkId) || allChunks.get(chunkId).score < chunk.score) {
            allChunks.set(chunkId, chunk);
          }
        });
      }

      const relevantChunks = Array.from(allChunks.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, 15);

      console.log(`Found ${relevantChunks.length} relevant chunks for welcome message`);

      // If no chunks found, provide a generic welcome
      if (relevantChunks.length === 0) {
        const genericWelcome = this.generateGenericWelcome(data);
        return {
          content: genericWelcome,
          sources: [],
        };
      }

      // Fetch resource details
      const uniqueResourceIds = [...new Set(relevantChunks.map(chunk => chunk.resourceId.toString()))];
      const resourcesCollection = this.databaseService.getCollection('resources');
      const resources = await resourcesCollection.find({
        _id: { $in: uniqueResourceIds.map(id => new ObjectId(id)) }
      }).toArray();

      const resourceMap = new Map(resources.map(r => [r._id.toString(), r]));

      const context = relevantChunks.map(chunk => chunk.chunkText).join('\n\n---\n\n');

      // Get unique resource titles
      const resourceTitles = uniqueResourceIds
        .map(id => {
          const resource = resourceMap.get(id);
          return resource ? `- ${resource.title} (${resource.type})` : '';
        })
        .filter(t => t)
        .join('\n');

      // Generate welcome message with Claude
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        system: WELCOME_SYSTEM_PROMPT,
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: `I'm creating a personalized welcome message for a new employee.

Employee Profile:
- Name: ${data.employeeName || 'New Employee'}
- Department: ${data.department || 'Not specified'}
- Roles: ${data.tags?.roles?.join(', ') || 'Not specified'}
- Skills: ${data.tags?.skills?.join(', ') || 'Not specified'}
- Interests: ${data.tags?.interests?.join(', ') || 'Not specified'}

Available company resources:
${resourceTitles}

Relevant content from company documents:
${context}

Please create a warm, personalized welcome message that highlights the most relevant information for this employee based on their profile. Make it friendly, encouraging, and actionable.`,
          },
        ],
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';

      // Deduplicate sources
      const uniqueSources = new Map<string, any>();
      
      for (const chunk of relevantChunks) {
        const resourceId = chunk.resourceId.toString();
        const resource = resourceMap.get(resourceId);
        
        if (!resource || uniqueSources.has(resourceId)) {
          continue;
        }
        
        uniqueSources.set(resourceId, {
          score: chunk.score,
          text: chunk.chunkText.substring(0, 200) + '...',
          resourceId: resourceId,
          resource: {
            id: resource._id.toString(),
            type: resource.type,
            title: resource.title,
            fileName: resource.fileName,
            fileUrl: resource.fileUrl,
            url: resource.url,
          },
        });
      }

      return {
        content,
        sources: Array.from(uniqueSources.values())
      };

    } catch (error) {
      console.error('Error generating welcome message:', error);
      // Fallback to generic welcome
      return {
        content: this.generateGenericWelcome(data),
        sources: [],
      };
    }
  }

  /**
   * Generate a generic welcome message when no resources are available
   */
  private generateGenericWelcome(data: {
    employeeName?: string;
    department?: string;
    tags?: {
      roles?: string[];
      skills?: string[];
      interests?: string[];
    };
  }): string {
    const name = data.employeeName || 'there';
    const dept = data.department ? ` in the ${data.department} department` : '';
    
    let message = `# Welcome to the team, ${name}! 👋\n\n`;
    message += `I'm OnboardAI, your personal onboarding assistant. I'm here to help you get acquainted with the company${dept}.\n\n`;
    
    if (data.tags) {
      const { roles, skills, interests } = data.tags;
      if (roles && roles.length > 0) {
        message += `I see you'll be working as ${roles.join(', ')}. `;
      }
      if (skills && skills.length > 0) {
        message += `With your skills in ${skills.join(', ')}, you'll fit right in! `;
      }
      if (interests && interests.length > 0) {
        message += `I also noticed you're interested in ${interests.join(', ')} - that's great!\n\n`;
      }
    }
    
    message += `## How I Can Help\n\n`;
    message += `- **Ask me anything** about the company, policies, or procedures\n`;
    message += `- **Find resources** quickly by asking for specific documents or information\n`;
    message += `- **Get guidance** on your onboarding process and next steps\n\n`;
    message += `To get started, your company administrator needs to upload some resources and documents. Once that's done, I'll be able to provide you with detailed, specific information about your role and the company.\n\n`;
    message += `In the meantime, feel free to ask me anything - I'll do my best to help!`;
    
    return message;
  }
}

