export interface IEmployee {
  _id?: string;
  name: string;
  email: string;
  password?: string;
  companyId: string;
  department: string;
  tags?: {
    roles?: string[];
    skills?: string[];
    interests?: string[];
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IEmployeeEmail {
  _id?: string;
  companyId: string;
  email: string;
  password: string;
  createdAt?: Date;
}

