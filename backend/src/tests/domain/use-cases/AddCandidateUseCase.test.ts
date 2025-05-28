import { AddCandidateUseCase } from '../../../domain/use-cases/AddCandidateUseCase';
import { ICandidateRepository } from '../../../domain/ports/output/ICandidateRepository';
import { IFileStorage, FileInput } from '../../../domain/ports/output/IFileStorage';
import { Candidate } from '../../../domain/entities/Candidate';

describe('AddCandidateUseCase', () => {
  let mockCandidateRepository: jest.Mocked<ICandidateRepository>;
  let mockFileStorage: jest.Mocked<IFileStorage>;
  let addCandidateUseCase: AddCandidateUseCase;

  beforeEach(() => {
    // Crear mocks para las dependencias
    mockCandidateRepository = {
      save: jest.fn(),
      findByEmail: jest.fn(),
    };
    mockFileStorage = {
      save: jest.fn(),
    };
    addCandidateUseCase = new AddCandidateUseCase(mockCandidateRepository, mockFileStorage);
  });

  it('should save a candidate and their CV successfully', async () => {
    // Arrange
    const candidateData: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt' | 'cvPath'> = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '1234567890',
      address: '123 Main St',
      education: 'Bachelor of Science',
      workExperience: 'Software Engineer at XYZ',
    };
    const cvFile: FileInput = {
      fileName: 'JohnDoe_CV.pdf',
      mimeType: 'application/pdf',
      content: Buffer.from('dummy pdf content'),
    };
    const expectedSavedCandidate: Candidate = {
      id: 1,
      ...candidateData,
      cvPath: '/uploads/cvs/JohnDoe_CV.pdf',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const cvStoragePath = '/uploads/cvs/JohnDoe_CV.pdf';

    mockCandidateRepository.findByEmail.mockResolvedValue(null); // Simular que el email no existe
    mockFileStorage.save.mockResolvedValue(cvStoragePath); // Simular guardado de archivo exitoso
    mockCandidateRepository.save.mockResolvedValue(expectedSavedCandidate); // Simular guardado de candidato exitoso

    // Act
    const result = await addCandidateUseCase.execute(candidateData, cvFile);

    // Assert
    expect(result).toEqual(expectedSavedCandidate);
    expect(mockFileStorage.save).toHaveBeenCalledWith(cvFile, expect.any(String)); // Verificar que se llamó a guardar archivo
    expect(mockCandidateRepository.save).toHaveBeenCalledWith({
      ...candidateData,
      cvPath: cvStoragePath,
    });
    expect(mockCandidateRepository.findByEmail).toHaveBeenCalledWith(candidateData.email);
  });

  it('should throw an error if the candidate email already exists', async () => {
    // Arrange
    const candidateData: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt' | 'cvPath'> = {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@example.com', // Email que ya existe
    };
    const cvFile: FileInput = {
      fileName: 'JaneDoe_CV.pdf',
      mimeType: 'application/pdf',
      content: Buffer.from('dummy pdf content for jane'),
    };
    const existingCandidate: Candidate = {
      id: 2,
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockCandidateRepository.findByEmail.mockResolvedValue(existingCandidate); // Simular que el email ya existe

    // Act & Assert
    // Verificar que la promesa es rechazada con un error específico
    await expect(addCandidateUseCase.execute(candidateData, cvFile))
      .rejects
      .toThrow('Candidate with this email already exists.');

    // Verificar que no se intentó guardar el archivo ni el candidato
    expect(mockFileStorage.save).not.toHaveBeenCalled();
    expect(mockCandidateRepository.save).not.toHaveBeenCalled();
    expect(mockCandidateRepository.findByEmail).toHaveBeenCalledWith(candidateData.email);
  });

  it('should throw an error if saving the CV fails', async () => {
    // Arrange
    const candidateData: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt' | 'cvPath'> = {
      firstName: 'CVFail',
      lastName: 'Test',
      email: 'cvfail.test@example.com',
    };
    const cvFile: FileInput = {
      fileName: 'cvfail.pdf',
      mimeType: 'application/pdf',
      content: Buffer.from('dummy content'),
    };
    mockCandidateRepository.findByEmail.mockResolvedValue(null);
    mockFileStorage.save.mockRejectedValue(new Error('Disk full')); // Simular fallo al guardar CV

    // Act & Assert
    await expect(addCandidateUseCase.execute(candidateData, cvFile))
      .rejects
      .toThrow('Could not save CV file.');

    expect(mockFileStorage.save).toHaveBeenCalledWith(cvFile, expect.any(String));
    expect(mockCandidateRepository.save).not.toHaveBeenCalled(); // No se debe intentar guardar el candidato
  });

  it('should throw an error if saving the candidate data fails after CV is saved', async () => {
    // Arrange
    const candidateData: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt' | 'cvPath'> = {
      firstName: 'DataFail',
      lastName: 'Test',
      email: 'datafail.test@example.com',
    };
    const cvFile: FileInput = {
      fileName: 'datafail.pdf',
      mimeType: 'application/pdf',
      content: Buffer.from('dummy content'),
    };
    const cvStoragePath = '/uploads/cvs/datafail.pdf';

    mockCandidateRepository.findByEmail.mockResolvedValue(null);
    mockFileStorage.save.mockResolvedValue(cvStoragePath); // CV se guarda bien
    mockCandidateRepository.save.mockRejectedValue(new Error('DB connection error')); // Falla al guardar en BD

    // Act & Assert
    await expect(addCandidateUseCase.execute(candidateData, cvFile))
      .rejects
      .toThrow('Could not save candidate data.');

    expect(mockFileStorage.save).toHaveBeenCalledWith(cvFile, expect.any(String));
    expect(mockCandidateRepository.save).toHaveBeenCalledWith({
      ...candidateData,
      cvPath: cvStoragePath,
    });
    // Aquí podríamos añadir una lógica de compensación: si la BD falla después de guardar el CV,
    // ¿deberíamos intentar borrar el CV? El caso de uso actual no lo hace.
  });

  it('should save a candidate successfully if no CV file is provided', async () => {
    const candidateData: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt' | 'cvPath'> = {
      firstName: 'NoCVProvided',
      lastName: 'Test',
      email: 'nocvprovided.test@example.com',
    };
    const expectedSavedCandidate: Candidate = {
      id: 3,
      ...candidateData,
      cvPath: undefined, // o null, dependiendo de la implementación exacta y el retorno del mock
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockCandidateRepository.findByEmail.mockResolvedValue(null);
    // Asegurarse de que el mock devuelva un candidato con cvPath como undefined o null
    // si el repositorio real lo hiciera.
    mockCandidateRepository.save.mockImplementation(async (data) => ({
        ...expectedSavedCandidate,
        cvPath: data.cvPath // Esto reflejará que cvPath es undefined si no se pasó
    }));


    const result = await addCandidateUseCase.execute(candidateData, undefined); // Sin CV

    expect(result.cvPath).toBeUndefined();
    expect(mockFileStorage.save).not.toHaveBeenCalled();
    expect(mockCandidateRepository.save).toHaveBeenCalledWith({
      ...candidateData,
      cvPath: undefined,
    });
  });

  // Aquí irían más tests: error al guardar archivo, error al guardar candidato, datos inválidos, etc.
});
