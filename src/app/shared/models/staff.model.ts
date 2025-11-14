export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  telNumber?: string;
  password: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface StaffCreateDto {
  firstName: string;
  lastName: string;
  email: string;
  telNumber?: number;
  password: string;
}

export interface StaffUpdateDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  isActive?: boolean;
}
