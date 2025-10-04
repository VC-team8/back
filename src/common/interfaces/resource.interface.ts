import { Document } from 'mongoose';

export interface IResource extends Document {
  _id: string;
  companyId: string;
  type: 'file' | 'url';
  title: string;
  url?: string;
  fileUrl?: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  processed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IResourceCreate {
  companyId: string;
  type: 'file' | 'url';
  title: string;
  url?: string;
  fileUrl?: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  processed?: boolean;
}

export interface IResourceUpdate {
  title?: string;
  url?: string;
  processed?: boolean;
}

