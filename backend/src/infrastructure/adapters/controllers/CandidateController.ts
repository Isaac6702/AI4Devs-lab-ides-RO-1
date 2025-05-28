import { Request, Response } from 'express';
import { AddCandidateUseCase, AddCandidateInput } from '../../../domain/use-cases/AddCandidateUseCase';
import { ICandidateRepository } from '../../../domain/ports/output/ICandidateRepository';
import { IFileStorage, FileInput } from '../../../domain/ports/output/IFileStorage';
import { Candidate } from '../../../domain/entities/Candidate';

export class CandidateController {
  private addCandidateUseCase: AddCandidateUseCase;

  constructor(candidateRepository: ICandidateRepository, fileStorage: IFileStorage) {
    this.addCandidateUseCase = new AddCandidateUseCase(candidateRepository, fileStorage);
  }

  async addCandidate(req: Request, res: Response): Promise<void> {
    try {
      const { firstName, lastName, email, phone, address, education, workExperience } = req.body;

      // Validaciones básicas de entrada (puedes expandirlas o usar una librería de validación)
      if (!firstName || !lastName || !email) {
        res.status(400).json({ message: 'First name, last name, and email are required.' });
        return;
      }

      const candidateData: AddCandidateInput = {
        firstName,
        lastName,
        email,
        phone,
        address,
        education,
        workExperience,
      };

      let cvFileInput: FileInput | undefined = undefined;
      if (req.file) {
        cvFileInput = {
          fileName: req.file.originalname,
          mimeType: req.file.mimetype,
          content: req.file.buffer, // Multer nos da el archivo en buffer si usamos memoryStorage
        };
      }

      const newCandidate = await this.addCandidateUseCase.execute(candidateData, cvFileInput);
      res.status(201).json(newCandidate);

    } catch (error: any) {
      console.error('[CandidateController] Error adding candidate:', error);
      if (error.message === 'Candidate with this email already exists.') {
        res.status(409).json({ message: error.message }); // 409 Conflict
      } else if (error.message === 'Could not save CV file.' || error.message === 'Could not save candidate data.') {
        res.status(500).json({ message: 'An error occurred while processing your request.', details: error.message });
      } else {
        res.status(500).json({ message: 'An unexpected error occurred.' });
      }
    }
  }
}

