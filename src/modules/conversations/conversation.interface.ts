import { ObjectId } from 'mongodb';

export interface Conversation {
  _id?: ObjectId;
  companyId: ObjectId;
  title: string;
  createdAt: Date;
}
