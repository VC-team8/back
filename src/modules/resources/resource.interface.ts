import { ObjectId } from 'mongodb';

export interface Resource {
  _id?: ObjectId;
  companyId: ObjectId;
  type: 'url' | 'file';
  title: string;
  url?: string;
  fileUrl?: string;
  createdAt: Date;
}
