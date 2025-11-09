export interface Document {
  id: number;
  documentId: number;
  firstName: string;
  lastName: string;
  status: 'ACTIVE' |'INACTIVE'| 'BORROWED' |'ARCHIVED';
  createdAt: Date;
  updatedAt: Date| null;
  deletedAt: Date| null;
}

export interface RegistryBookCreateDto {
  documentId: number;
  firstName: string;
  lastName: string;
  status?: Document['status'];
}

export interface RegistryBookUpdateDto {
  id:number
  documentId?: number;
  firstName?: string;
  lastName?: string;
  status?: Document['status'];
}
