import { ObjectId } from 'mongodb';

export interface Message {
  _id?: ObjectId;
  conversationId: ObjectId;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  createdAt: Date;
}
