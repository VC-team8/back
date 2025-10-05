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
}
