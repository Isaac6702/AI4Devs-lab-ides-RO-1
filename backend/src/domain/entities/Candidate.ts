export interface Candidate {
  id?: number; // Opcional porque se genera en la BD
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  education?: string; // Podría ser un objeto más complejo o JSON
  workExperience?: string; // Podría ser un objeto más complejo o JSON
  cvPath?: string;
  createdAt?: Date;
  updatedAt?: Date;
}