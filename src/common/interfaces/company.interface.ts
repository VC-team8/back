import { Document } from 'mongoose';

export interface ICompany extends Document {
  _id: string;
  name: string;
  industry: string;
  size: string;
  contactName: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICompanyCreate {
  name: string;
  industry: string;
  size: string;
  contactName: string;
  email: string;
}

export interface ICompanyUpdate {
  name?: string;
  industry?: string;
  size?: string;
  contactName?: string;
  email?: string;
}

