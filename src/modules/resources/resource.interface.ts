import { ObjectId } from 'mongodb';

export interface Resource {
  _id?: ObjectId;
  companyId: ObjectId;
  type: 'url' | 'file';
  title: string;
  url?: string;
  fileUrl?: string;
  fileData?: Buffer;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  tags: string[];
  createdAt: Date;
  
  // URL as virtual file fields
  extractedContent?: string;
  extractedAt?: Date;
  contentLength?: number;
  originalUrl?: string;
  
  // Processing status
  processed?: boolean;
  processedAt?: Date;
  processingError?: string;
}
