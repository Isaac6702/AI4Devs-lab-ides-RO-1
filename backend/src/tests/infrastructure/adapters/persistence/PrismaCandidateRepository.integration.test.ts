import { PrismaClient } from '@prisma/client';
import { PrismaCandidateRepository } from '../../../../../src/infrastructure/adapters/persistence/PrismaCandidateRepository';
import { Candidate } from '../../../../../src/domain/entities/Candidate';

const prisma = new PrismaClient();
let candidateRepository: PrismaCandidateRepository;

describe('PrismaCandidateRepository Integration Tests', () => {
  beforeAll(() => {
    candidateRepository = new PrismaCandidateRepository(); // Utiliza la instancia global de PrismaClient que PrismaCandidateRepository crea internamente
  });

  beforeEach(async () => {
    // Limpiar la tabla de candidatos antes de cada test
    await prisma.candidate.deleteMany({});
  });

  afterAll(async () => {
    // Limpiar la tabla de candidatos después de todos los tests
    await prisma.candidate.deleteMany({});
    // Desconectar PrismaClient
    await prisma.$disconnect();
  });

  it('should save a new candidate and find them by email', async () => {
    const candidateData: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt'> = {
      firstName: 'Integration',
      lastName: 'Test',
      email: 'integration.test@example.com',
      phone: '123456789',
      address: '123 Test St',
      education: 'BSc Testing',
      workExperience: '5 years in testing',
      cvPath: '/cvs/integration.pdf',
    };

    const savedCandidate = await candidateRepository.save(candidateData);

    expect(savedCandidate).toBeDefined();
    expect(savedCandidate.id).toBeDefined();
    expect(savedCandidate.email).toBe(candidateData.email);
    expect(savedCandidate.firstName).toBe(candidateData.firstName);
    expect(savedCandidate.createdAt).toBeInstanceOf(Date);
    expect(savedCandidate.updatedAt).toBeInstanceOf(Date);

    const foundCandidate = await candidateRepository.findByEmail(candidateData.email);

    expect(foundCandidate).toBeDefined();
    expect(foundCandidate!.id).toBe(savedCandidate.id);
    expect(foundCandidate!.email).toBe(candidateData.email);
  });

  it('should return null when trying to find a candidate by an non-existent email', async () => {
    const foundCandidate = await candidateRepository.findByEmail('nonexistent@example.com');
    expect(foundCandidate).toBeNull();
  });

  it('should save a candidate with only mandatory fields', async () => {
    const candidateData: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt'> = {
      firstName: 'Minimal',
      lastName: 'User',
      email: 'minimal.user@example.com',
      // phone, address, education, workExperience, cvPath son opcionales
    };

    const savedCandidate = await candidateRepository.save(candidateData);

    expect(savedCandidate).toBeDefined();
    expect(savedCandidate.id).toBeDefined();
    expect(savedCandidate.email).toBe(candidateData.email);
    expect(savedCandidate.firstName).toBe(candidateData.firstName);
    expect(savedCandidate.phone).toBeNull(); // Prisma establece campos opcionales no provistos a null
  });

  // Opcional: Test para la constraint de unicidad del email a nivel de base de datos
  // Este test fallará si intentas guardar dos candidatos con el mismo email directamente
  // sin una verificación previa como la que hace AddCandidateUseCase.
  it('should throw an error when trying to save a candidate with an existing email due to DB constraint', async () => {
    const candidateData1: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt'> = {
      firstName: 'Duplicate',
      lastName: 'Email',
      email: 'duplicate.email@example.com',
    };
    await candidateRepository.save(candidateData1);

    const candidateData2: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt'> = {
      firstName: 'Another',
      lastName: 'User',
      email: 'duplicate.email@example.com', // Mismo email
    };

    // PrismaClientKnownRequestError con código P2002 indica una violación de constraint unique
    await expect(candidateRepository.save(candidateData2))
      .rejects
      .toThrowError("Database error while saving candidate."); // El error que relanzamos en el repo
      // Para ser más específico, podrías capturar el error original de Prisma y verificar su código P2002
      // pero eso haría el test más acoplado a la implementación exacta del manejo de errores del repositorio.
  });
});

