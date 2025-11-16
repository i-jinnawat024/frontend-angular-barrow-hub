export interface Document {
  id: number;
  documentId: number;
  firstName: string;
  lastName: string;
  status: 'ACTIVE' |'INACTIVE'| 'BORROWED' |'ARCHIVED';
  description?: string
  createdAt?: Date| null | undefined;
  updatedAt?: Date| null | undefined;
  deletedAt?: Date| null | undefined;
}

export interface DocumentCreateDto {
  documentId: number;
  firstName: string;
  lastName: string;
  status?: Document['status'];
}

export interface DocumentUpdateDto {
  id:number
  documentId?: number;
  firstName?: string;
  lastName?: string;
  status?: Document['status'];
}
