import { Candidate } from '../../entities/Candidate';

export interface ICandidateRepository {
  save(candidate: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt'>): Promise<Candidate>;

  findByEmail(email: string): Promise<Candidate | null>;
}