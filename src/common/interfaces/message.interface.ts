import { Document } from 'mongoose';

export interface ISource {
  type: 'file' | 'url';
  title: string;
  url?: string;
  excerpt?: string;
}

export interface IMessage extends Document {
  _id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: ISource[];
  createdAt: Date;
}

export interface IMessageCreate {
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: ISource[];
}

export interface IMessageUpdate {
  content?: string;
  sources?: ISource[];
}

