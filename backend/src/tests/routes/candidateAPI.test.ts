import request from 'supertest';
import { app } from '../../index'; // Importar la instancia de la app Express
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Ajustar la ruta base para las cargas de prueba.
// Desde src/tests/routes -> ../../uploads
const UPLOADS_BASE_PATH = path.resolve(__dirname, '../../../uploads');
const CV_SUBDIRECTORY = 'cvs'; // El subdirectorio que usa AddCandidateUseCase/FileSystemStorageAdapter

describe('POST /api/candidates - Candidate API Tests', () => {
  beforeEach(async () => {
    // Limpiar la tabla de candidatos antes de cada test
    await prisma.candidate.deleteMany({});
    // Limpiar la carpeta de CVs de prueba
    const cvDirectory = path.join(UPLOADS_BASE_PATH, CV_SUBDIRECTORY);
    if (fs.existsSync(cvDirectory)) {
      fs.rmSync(cvDirectory, { recursive: true, force: true });
    }
    // Recrear el directorio base de uploads y el de cvs si FileSystemStorageAdapter los espera
    // El constructor de FileSystemStorageAdapter crea 'uploads' si no existe.
    // El método save de FileSystemStorageAdapter crea el subdirectorio (ej: 'cvs') si no existe.
    // Por lo tanto, solo necesitamos asegurar que UPLOADS_BASE_PATH exista si la limpieza lo eliminó por completo (no debería con rmSync en subdirectorio)
    // Pero para ser seguros, y dado que FileSystemStorageAdapter lo crea, podemos omitir la creación aquí si la limpieza es solo del subdirectorio.
    // Sin embargo, si la limpieza elimina UPLOADS_BASE_PATH, entonces sí hay que crearlo.
    // Para simplificar, nos aseguramos que el directorio de CVs esté limpio y exista.
    if (!fs.existsSync(cvDirectory)) {
        fs.mkdirSync(cvDirectory, { recursive: true });
    }
  });

  afterAll(async () => {
    // Limpieza final
    await prisma.candidate.deleteMany({});
    const cvDirectory = path.join(UPLOADS_BASE_PATH, CV_SUBDIRECTORY);
    if (fs.existsSync(cvDirectory)) {
      fs.rmSync(cvDirectory, { recursive: true, force: true });
    }
    // Opcional: eliminar la carpeta uploads si se creó solo para tests y está vacía
    // if (fs.existsSync(UPLOADS_BASE_PATH) && fs.readdirSync(UPLOADS_BASE_PATH).length === 0) {
    //   fs.rmdirSync(UPLOADS_BASE_PATH);
    // }
    await prisma.$disconnect();
  });

  it('should successfully add a new candidate with a CV', async () => {
    const response = await request(app)
      .post('/api/candidates')
      .field('firstName', 'Api')
      .field('lastName', 'Test')
      .field('email', 'api.test@example.com')
      .field('phone', '123456789')
      .field('address', '123 API St')
      .field('education', 'BSc API Testing')
      .field('workExperience', '5 years in API testing')
      .attach('cv', Buffer.from('Este es un CV de prueba en PDF.'), 'test-cv.pdf'); // Adjuntar archivo

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.email).toBe('api.test@example.com');
    expect(response.body.firstName).toBe('Api');
    expect(response.body.cvPath).toBe('cvs/test-cv.pdf'); // Verificar la ruta del CV

    // Verificar que el archivo exista
    const expectedCvPath = path.join(UPLOADS_BASE_PATH, response.body.cvPath);
    expect(fs.existsSync(expectedCvPath)).toBe(true);

    // Verificar que el candidato exista en la BD
    const candidateInDb = await prisma.candidate.findUnique({ where: { email: 'api.test@example.com' } });
    expect(candidateInDb).not.toBeNull();
    expect(candidateInDb?.cvPath).toBe('cvs/test-cv.pdf');
  });

  it('should successfully add a new candidate without a CV', async () => {
    const response = await request(app)
      .post('/api/candidates')
      .field('firstName', 'NoCV')
      .field('lastName', 'User')
      .field('email', 'nocv.user@example.com');

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.email).toBe('nocv.user@example.com');
    expect(response.body.cvPath).toBeNull(); // Cambiado de toBeUndefined() a toBeNull()

    const candidateInDb = await prisma.candidate.findUnique({ where: { email: 'nocv.user@example.com' } });
    expect(candidateInDb).not.toBeNull();
    expect(candidateInDb?.cvPath).toBeNull();
  });

  it('should return 400 if required fields (firstName, lastName, email) are missing', async () => {
    const response = await request(app)
      .post('/api/candidates')
      .field('firstName', 'MissingLastName');

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('First name, last name, and email are required.');
  });

  it('should return 409 if email already exists', async () => {
    await request(app)
      .post('/api/candidates')
      .field('firstName', 'Existing')
      .field('lastName', 'User')
      .field('email', 'existing.user@example.com');

    const response = await request(app)
      .post('/api/candidates')
      .field('firstName', 'Another')
      .field('lastName', 'User')
      .field('email', 'existing.user@example.com');

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('Candidate with this email already exists.');
  });

  it('should return 400 for invalid file type (e.g., .txt instead of .pdf/.docx)', async () => {
    const response = await request(app)
      .post('/api/candidates')
      .field('firstName', 'FileType')
      .field('lastName', 'Test')
      .field('email', 'filetype.test@example.com')
      .attach('cv', Buffer.from('Este es un archivo de texto.'), 'test-cv.txt');

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Invalid file type. Only PDF and DOCX are allowed.');
  });

  it('should return 400 if uploaded CV file size exceeds limit', async () => {
    // Crear un buffer que exceda el límite de 5MB (5 * 1024 * 1024 bytes)
    const fileSizeLimit = 5 * 1024 * 1024;
    const oversizedBuffer = Buffer.alloc(fileSizeLimit + 1024 * 100, 'a'); // Aprox 5.1MB

    const response = await request(app)
      .post('/api/candidates')
      .field('firstName', 'LargeFile')
      .field('lastName', 'Test')
      .field('email', 'largefile.test@example.com')
      .attach('cv', oversizedBuffer, 'large-cv.pdf');

    expect(response.status).toBe(400);
    // El mensaje exacto de Multer para LIMIT_FILE_SIZE es "File too large"
    // y nuestro manejador de errores en candidateRoutes.ts lo formatea como "Multer error: File too large"
    expect(response.body.message).toBe('Multer error: File too large');
  });
});
