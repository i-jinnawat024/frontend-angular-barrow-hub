export interface RegistryBook {
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
  bookNumber: string;
  name: string;
  description?: string;
  status?: RegistryBook['status'];
}

export interface RegistryBookUpdateDto {
  documentId?: number;
  firstName?: string;
  lastName?: string;
  description?: string;
  status?: RegistryBook['status'];
}
