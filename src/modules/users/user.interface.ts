import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId;
  companyId: ObjectId;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  createdAt: Date;
}
