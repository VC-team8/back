import { Document } from 'mongoose';

export interface IConversation extends Document {
  _id: string;
  companyId: string;
  title?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IConversationCreate {
  companyId: string;
  title?: string;
}

export interface IConversationUpdate {
  title?: string;
}

