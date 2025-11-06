export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  department?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface StaffCreateDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  department?: string;
  isActive?: boolean;
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
