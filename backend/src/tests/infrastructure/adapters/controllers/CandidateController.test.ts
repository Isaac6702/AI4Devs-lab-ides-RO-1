import { Request, Response } from 'express';
import { CandidateController } from '../../../../infrastructure/adapters/controllers/CandidateController';
import { AddCandidateUseCase } from '../../../../domain/use-cases/AddCandidateUseCase';
import { ICandidateRepository } from '../../../../domain/ports/output/ICandidateRepository';
import { IFileStorage } from '../../../../domain/ports/output/IFileStorage';
import { Candidate } from '../../../../domain/entities/Candidate';

// Mockear el AddCandidateUseCase completo
jest.mock('../../../../domain/use-cases/AddCandidateUseCase');

describe('CandidateController', () => {
  let candidateController: CandidateController;
  let mockAddCandidateUseCase: jest.Mocked<AddCandidateUseCase>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    // Resetear mocks y crear nuevas instancias para cada test
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };

    const mockCandidateRepository = {} as ICandidateRepository;
    const mockFileStorage = {} as IFileStorage;
    mockAddCandidateUseCase = new AddCandidateUseCase(mockCandidateRepository, mockFileStorage) as jest.Mocked<AddCandidateUseCase>;

    mockAddCandidateUseCase.execute = jest.fn(); // Asegurarse de que execute es un mock

    candidateController = new CandidateController(mockCandidateRepository, mockFileStorage);
    (candidateController as any).addCandidateUseCase = mockAddCandidateUseCase;

    mockRequest = {
      body: {},
      file: undefined,
    };
  });

  it('should add a candidate successfully and return 201', async () => {
    mockRequest.body = {
      firstName: 'Unit',
      lastName: 'Test',
      email: 'unit.test@example.com',
    };
    const mockFile = {
        originalname: 'cv.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('test cv content'),
    } as Express.Multer.File;
    mockRequest.file = mockFile;

    const mockSavedCandidate = { id: 1, ...mockRequest.body, cvPath: 'cvs/cv.pdf' } as Candidate;
    mockAddCandidateUseCase.execute.mockResolvedValue(mockSavedCandidate);

    await candidateController.addCandidate(mockRequest as Request, mockResponse as Response);

    expect(mockAddCandidateUseCase.execute).toHaveBeenCalledWith(
      {
        firstName: 'Unit',
        lastName: 'Test',
        email: 'unit.test@example.com',
      },
      {
        fileName: mockFile.originalname,
        mimeType: mockFile.mimetype,
        content: mockFile.buffer,
      }
    );
    expect(mockStatus).toHaveBeenCalledWith(201);
    expect(mockJson).toHaveBeenCalledWith(mockSavedCandidate);
  });

  it('should return 400 if required fields are missing', async () => {
    mockRequest.body = { firstName: 'OnlyFirstName' };

    await candidateController.addCandidate(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({ message: 'First name, last name, and email are required.' });
    expect(mockAddCandidateUseCase.execute).not.toHaveBeenCalled();
  });

  it('should return 409 if candidate email already exists', async () => {
    mockRequest.body = { firstName: 'Conflict', lastName: 'User', email: 'conflict@example.com' };
    mockAddCandidateUseCase.execute.mockRejectedValue(new Error('Candidate with this email already exists.'));

    await candidateController.addCandidate(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(409);
    expect(mockJson).toHaveBeenCalledWith({ message: 'Candidate with this email already exists.' });
  });

  it('should return 500 if CV file could not be saved', async () => {
    mockRequest.body = { firstName: 'CVFail', lastName: 'CtrlTest', email: 'cvfail.ctrl@example.com' };
    mockRequest.file = { originalname: 'cv.pdf', mimetype: 'application/pdf', buffer: Buffer.from('') } as Express.Multer.File;
    mockAddCandidateUseCase.execute.mockRejectedValue(new Error('Could not save CV file.'));

    await candidateController.addCandidate(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ message: 'An error occurred while processing your request.', details: 'Could not save CV file.' });
  });

  it('should return 500 if candidate data could not be saved', async () => {
    mockRequest.body = { firstName: 'DataFail', lastName: 'CtrlTest', email: 'datafail.ctrl@example.com' };
    mockAddCandidateUseCase.execute.mockRejectedValue(new Error('Could not save candidate data.'));

    await candidateController.addCandidate(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ message: 'An error occurred while processing your request.', details: 'Could not save candidate data.' });
  });

  it('should return 500 for an unexpected error from use case', async () => {
    mockRequest.body = { firstName: 'Unexpected', lastName: 'CtrlTest', email: 'unexpected.ctrl@example.com' };
    mockAddCandidateUseCase.execute.mockRejectedValue(new Error('Some unexpected generic error.'));

    await candidateController.addCandidate(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ message: 'An unexpected error occurred.' });
  });
});

