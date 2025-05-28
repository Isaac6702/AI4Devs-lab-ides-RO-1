import { PrismaClient } from '@prisma/client';
import { PrismaCandidateRepository } from '../../../../infrastructure/adapters/persistence/PrismaCandidateRepository';
import { Candidate } from '../../../../domain/entities/Candidate';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

// Declarar el mock de PrismaClient a nivel de módulo para que esté disponible en los tests
let mockPrismaClient: DeepMockProxy<PrismaClient>;

describe('PrismaCandidateRepository - Unit Tests', () => {
  let candidateRepository: PrismaCandidateRepository;

  beforeEach(() => {
    // Crear un nuevo mock para PrismaClient antes de cada test
    mockPrismaClient = mockDeep<PrismaClient>();

    // Crear una nueva instancia del repositorio
    candidateRepository = new PrismaCandidateRepository();
    // Reemplazar la instancia interna de prisma con nuestro mock
    (candidateRepository as any).prisma = mockPrismaClient;
  });

  describe('save', () => {
    it('should save a candidate successfully', async () => {
      const candidateData: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt'> = {
        firstName: 'UnitSave',
        lastName: 'Test',
        email: 'unitsave.test@example.com',
      };
      // Asegúrate de que el tipo de retorno del mock coincida con lo que Prisma realmente devuelve
      const expectedSavedCandidateDbResponse = {
        ...candidateData,
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Asegúrate de que todos los campos, incluidos los opcionales que serían null, estén aquí
        phone: null,
        address: null,
        education: null,
        workExperience: null,
        cvPath: null,
      };

      mockPrismaClient.candidate.create.mockResolvedValue(expectedSavedCandidateDbResponse);

      const result = await candidateRepository.save(candidateData);

      // La aserción debe ser contra lo que el método del repositorio devuelve,
      // que debería ser compatible con la entidad Candidate.
      expect(result).toEqual(expect.objectContaining(candidateData));
      expect(result.id).toBe(expectedSavedCandidateDbResponse.id);
      expect(mockPrismaClient.candidate.create).toHaveBeenCalledWith({ data: candidateData });
    });

    it('should throw a custom error if PrismaClient.candidate.create fails', async () => {
      const candidateData: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt'> = {
        firstName: 'UnitSaveFail',
        lastName: 'Test',
        email: 'unitsavefail.test@example.com',
      };
      const prismaError = new Error('Generic Prisma create error');
      mockPrismaClient.candidate.create.mockRejectedValue(prismaError);

      await expect(candidateRepository.save(candidateData))
        .rejects
        .toThrow('Database error while saving candidate.');

      expect(mockPrismaClient.candidate.create).toHaveBeenCalledWith({ data: candidateData });
    });
  });

  describe('findByEmail', () => {
    it('should find a candidate by email successfully', async () => {
      const email = 'findme@example.com';
      const expectedCandidateDbResponse = {
        id: 1,
        firstName: 'Find',
        lastName: 'Me',
        email,
        createdAt: new Date(),
        updatedAt: new Date(),
        phone: null,
        address: null,
        education: null,
        workExperience: null,
        cvPath: null,
      };

      mockPrismaClient.candidate.findUnique.mockResolvedValue(expectedCandidateDbResponse);

      const result = await candidateRepository.findByEmail(email);

      expect(result).toEqual(expect.objectContaining({ email: expectedCandidateDbResponse.email }));
      expect(result!.id).toBe(expectedCandidateDbResponse.id);
      expect(mockPrismaClient.candidate.findUnique).toHaveBeenCalledWith({ where: { email } });
    });

    it('should return null if candidate is not found by email', async () => {
      const email = 'notfound@example.com';
      mockPrismaClient.candidate.findUnique.mockResolvedValue(null);

      const result = await candidateRepository.findByEmail(email);

      expect(result).toBeNull();
      expect(mockPrismaClient.candidate.findUnique).toHaveBeenCalledWith({ where: { email } });
    });

    it('should throw a custom error if PrismaClient.candidate.findUnique fails', async () => {
      const email = 'findfail@example.com';
      const prismaError = new Error('Generic Prisma findUnique error');
      mockPrismaClient.candidate.findUnique.mockRejectedValue(prismaError);

      await expect(candidateRepository.findByEmail(email))
        .rejects
        .toThrow('Database error while finding candidate by email.');

      expect(mockPrismaClient.candidate.findUnique).toHaveBeenCalledWith({ where: { email } });
    });
  });
});

