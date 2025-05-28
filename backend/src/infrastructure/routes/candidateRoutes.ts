import { Router } from 'express';
import multer from 'multer';
import { CandidateController } from '../adapters/controllers/CandidateController';
import { PrismaCandidateRepository } from '../adapters/persistence/PrismaCandidateRepository';
import { FileSystemStorageAdapter } from '../adapters/storage/FileSystemStorageAdapter';

// Configuración de Multer para manejar la carga de archivos en memoria
const upload = multer({
  storage: multer.memoryStorage(), // Almacena el archivo en un buffer en req.file.buffer
  limits: {
    fileSize: 5 * 1024 * 1024, // Límite de tamaño de archivo (ej: 5MB)
  },
  fileFilter: (req, file, cb) => {
    // Validar tipo de archivo (PDF o DOCX)
    if (file.mimetype === 'application/pdf' || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      // Rechazar archivo con un error específico que se puede manejar en el controlador o un middleware de errores
      // Multer pasará este error a Express.
      cb(new Error('Invalid file type. Only PDF and DOCX are allowed.'));
    }
  },
});

const router = Router();

// Instanciar dependencias
const candidateRepository = new PrismaCandidateRepository();
const fileStorage = new FileSystemStorageAdapter();
const candidateController = new CandidateController(candidateRepository, fileStorage);

// Definir la ruta para añadir un candidato
// Se espera que la solicitud sea multipart/form-data y que el archivo del CV venga en un campo llamado 'cv'
router.post(
  '/',
  upload.single('cv'), // Middleware de Multer para un solo archivo en el campo 'cv'
  (req: any, res: any, next: any) => { // Manejo de errores de Multer
    if (req.fileValidationError) {
        return res.status(400).json({ message: req.fileValidationError });
    }
    // Si multer pasa un error (ej. tipo de archivo inválido desde fileFilter)
    // upload.single() lo pasará a next(). Necesitamos un error handler global o uno aquí.
    // Por ahora, lo dejamos para que el error handler global de Express lo capture si no se maneja antes.
    next();
  },
  (req, res) => candidateController.addCandidate(req, res) // Llama al método del controlador
);

// Middleware de manejo de errores específico para Multer (opcional, si quieres centralizarlo aquí)
// Este es un ejemplo, podrías tener un middleware de errores global más robusto en tu app.ts o index.ts
router.use((err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    // Un error de Multer ocurrió al subir.
    return res.status(400).json({ message: `Multer error: ${err.message}` });
  } else if (err) {
    // Un error desconocido ocurrió (ej. el error de fileFilter).
    if (err.message === 'Invalid file type. Only PDF and DOCX are allowed.') {
        return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: `Unknown error during file upload: ${err.message}` });
  }
  next();
});

export default router;

