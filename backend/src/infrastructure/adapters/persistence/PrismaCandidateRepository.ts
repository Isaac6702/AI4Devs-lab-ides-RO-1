import { PrismaClient } from '@prisma/client';
import { Candidate } from '../../../domain/entities/Candidate';
import { ICandidateRepository } from '../../../domain/ports/output/ICandidateRepository';

// Asegúrate de que el tipo de entrada para 'save' coincida con lo que Prisma espera
// y lo que definimos en ICandidateRepository (Omit<Candidate, 'id' | 'createdAt' | 'updatedAt'>)

export class PrismaCandidateRepository implements ICandidateRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async save(candidateData: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt'>): Promise<Candidate> {
    try {
      const savedCandidate = await this.prisma.candidate.create({
        data: candidateData,
      });
      // Prisma devuelve un objeto que ya debería coincidir con la entidad Candidate definida en schema.prisma
      // Si tu entidad Candidate del dominio es ligeramente diferente, aquí harías el mapeo.
      return savedCandidate as Candidate; // Hacemos un type assertion si estamos seguros de la compatibilidad
    } catch (error) {
      // Aquí podrías loguear el error o manejar errores específicos de Prisma (ej. violaciones de unicidad no capturadas antes)
      console.error("Error saving candidate with Prisma:", error);
      throw new Error("Database error while saving candidate."); // Re-lanzar o lanzar un error más específico del dominio/aplicación
    }
  }

  async findByEmail(email: string): Promise<Candidate | null> {
    try {
      const candidate = await this.prisma.candidate.findUnique({
        where: { email },
      });
      return candidate as Candidate | null; // Type assertion si es necesario
    } catch (error) {
      console.error("Error finding candidate by email with Prisma:", error);
      throw new Error("Database error while finding candidate by email.");
    }
  }

  // Implementa otros métodos de ICandidateRepository si los añades más tarde
  // async findById(id: number): Promise<Candidate | null> { ... }
  // async findAll(): Promise<Candidate[]> { ... }
}

