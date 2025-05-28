import { Candidate } from '../entities/Candidate';
import { ICandidateRepository } from '../ports/output/ICandidateRepository';
import { IFileStorage, FileInput } from '../ports/output/IFileStorage';

// Definimos el tipo para los datos de entrada del candidato, excluyendo los campos que se generan automáticamente o se manejan por separado (cvPath)
export type AddCandidateInput = Omit<Candidate, 'id' | 'createdAt' | 'updatedAt' | 'cvPath'>;

export class AddCandidateUseCase {
  constructor(
    private readonly candidateRepository: ICandidateRepository,
    private readonly fileStorage: IFileStorage
  ) {}

  async execute(candidateData: AddCandidateInput, cvFile?: FileInput): Promise<Candidate> {
    // 1. Validar que el email no exista previamente
    const existingCandidate = await this.candidateRepository.findByEmail(candidateData.email);
    if (existingCandidate) {
      throw new Error('Candidate with this email already exists.'); // Considerar un error más específico/manejable
    }

    let cvPath: string | undefined = undefined;

    // 2. Si se proporciona un CV, guardarlo
    if (cvFile) {
      try {
        // Definir una ruta de destino para el CV, podría ser más dinámica o configurable
        const destinationDirectory = 'cvs'; // Ejemplo: /uploads/cvs/filename.pdf
        cvPath = await this.fileStorage.save(cvFile, destinationDirectory);
      } catch (error) {
        // Manejar el error de guardado de archivo. Podrías querer loguearlo o lanzar un error específico.
        console.error('Error saving CV file:', error);
        throw new Error('Could not save CV file.');
      }
    }

    // 3. Preparar los datos del candidato para guardar
    const candidateToSave: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt'> = {
      ...candidateData,
      cvPath: cvPath, // Añadir la ruta del CV si se guardó
    };

    // 4. Guardar el candidato en el repositorio
    try {
      const savedCandidate = await this.candidateRepository.save(candidateToSave);
      return savedCandidate;
    } catch (error) {
      // Manejar el error de guardado en la base de datos.
      console.error('Error saving candidate to repository:', error);
      // Podrías querer limpiar el archivo CV si se guardó pero la BD falló (compensación)
      throw new Error('Could not save candidate data.');
    }
  }
}

