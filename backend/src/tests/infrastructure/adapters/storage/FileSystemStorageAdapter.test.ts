import * as fs from 'fs';
import * as path from 'path';
import { FileSystemStorageAdapter } from '../../../../../src/infrastructure/adapters/storage/FileSystemStorageAdapter';
import { FileInput } from '../../../../../src/domain/ports/output/IFileStorage';

// Define una ruta de prueba para las cargas, diferente de la de producción
const TEST_UPLOADS_BASE_PATH = path.resolve(__dirname, '../../../../../test-uploads');

describe('FileSystemStorageAdapter', () => {
  let storageAdapter: FileSystemStorageAdapter;

  beforeAll(() => {
    // Modificar la ruta base de carga del adaptador para que apunte al directorio de prueba
    // Esto es un poco invasivo; idealmente, la ruta base sería configurable a través del constructor.
    // Por ahora, para simplificar, la sobreescribimos después de instanciar.
    storageAdapter = new FileSystemStorageAdapter();
    (storageAdapter as any).baseUploadPath = TEST_UPLOADS_BASE_PATH;

    // Asegurarse de que el directorio de prueba base exista antes de los tests
    if (!fs.existsSync(TEST_UPLOADS_BASE_PATH)) {
      fs.mkdirSync(TEST_UPLOADS_BASE_PATH, { recursive: true });
    }
  });

  afterEach(() => {
    // Limpiar el directorio de prueba después de cada test para evitar interferencias
    // Esto elimina el directorio y su contenido.
    if (fs.existsSync(TEST_UPLOADS_BASE_PATH)) {
      fs.rmSync(TEST_UPLOADS_BASE_PATH, { recursive: true, force: true });
      // Volver a crear el directorio base para el siguiente test, ya que el constructor del adapter lo espera
      fs.mkdirSync(TEST_UPLOADS_BASE_PATH, { recursive: true });
    }
  });

  afterAll(() => {
    // Limpieza final del directorio de prueba base después de todos los tests
    if (fs.existsSync(TEST_UPLOADS_BASE_PATH)) {
      fs.rmSync(TEST_UPLOADS_BASE_PATH, { recursive: true, force: true });
    }
  });

  it('should save a file to the specified subdirectory and return the correct relative path', async () => {
    const fileInput: FileInput = {
      fileName: 'test-cv.pdf',
      mimeType: 'application/pdf',
      content: Buffer.from('Este es el contenido de un CV de prueba.'),
    };
    const subDirectory = 'cvs';

    const relativePath = await storageAdapter.save(fileInput, subDirectory);

    // 1. Verificar la ruta devuelta
    expect(relativePath).toBe('cvs/test-cv.pdf');

    // 2. Verificar que el archivo exista en la ubicación esperada
    const expectedFilePath = path.join(TEST_UPLOADS_BASE_PATH, subDirectory, fileInput.fileName);
    expect(fs.existsSync(expectedFilePath)).toBe(true);

    // 3. Verificar el contenido del archivo
    const fileContent = fs.readFileSync(expectedFilePath);
    expect(fileContent.toString()).toBe(fileInput.content.toString());
  });

  it('should create the subdirectory if it does not exist', async () => {
    const fileInput: FileInput = {
      fileName: 'another-test-file.txt',
      mimeType: 'text/plain',
      content: Buffer.from('Otro archivo de prueba.'),
    };
    const newSubDirectory = 'new-folder/subfolder'; // Subdirectorio anidado

    await storageAdapter.save(fileInput, newSubDirectory);

    const expectedFilePath = path.join(TEST_UPLOADS_BASE_PATH, newSubDirectory, fileInput.fileName);
    expect(fs.existsSync(expectedFilePath)).toBe(true);
    const targetDirectoryPath = path.join(TEST_UPLOADS_BASE_PATH, newSubDirectory);
    expect(fs.existsSync(targetDirectoryPath)).toBe(true);
    expect(fs.lstatSync(targetDirectoryPath).isDirectory()).toBe(true);
  });

  it('should correctly handle filenames with spaces or special characters (basic test)', async () => {
    const fileNameWithSpaces = 'CV de John Doe.docx';
    const fileInput: FileInput = {
      fileName: fileNameWithSpaces,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      content: Buffer.from('Contenido del CV con espacios en el nombre.'),
    };
    const subDirectory = 'resumes';

    const relativePath = await storageAdapter.save(fileInput, subDirectory);

    // path.basename se encarga de esto, así que el nombre no debería cambiar.
    expect(relativePath).toBe(`resumes/${fileNameWithSpaces}`);

    const expectedFilePath = path.join(TEST_UPLOADS_BASE_PATH, subDirectory, fileNameWithSpaces);
    expect(fs.existsSync(expectedFilePath)).toBe(true);
  });

  it('should throw an error if file content is not provided (or handle as per design)', async () => {
    // Este test depende de cómo quieras que se comporte. fs.promises.writeFile fallará si el buffer está mal.
    const fileInput: FileInput = {
      fileName: 'empty-file.txt',
      mimeType: 'text/plain',
      content: null as any, // Simular contenido inválido
    };
    const subDirectory = 'errors';

    await expect(storageAdapter.save(fileInput, subDirectory))
      .rejects
      .toThrow('Could not save file to filesystem.');
      // El error original de fs.writeFile sería algo como "The "data" argument must be of type string or an instance of Buffer, TypedArray, or DataView. Received null"
  });

  it('should create the default base upload directory if it does not exist on instantiation', () => {
    const actualDefaultUploadPath = path.resolve(
      __dirname,
      '../../../../../uploads'
    );

    if (fs.existsSync(actualDefaultUploadPath)) {
      fs.rmSync(actualDefaultUploadPath, { recursive: true, force: true });
    }
    expect(fs.existsSync(actualDefaultUploadPath)).toBe(false);

    const newAdapterInstance = new FileSystemStorageAdapter();

    expect(fs.existsSync(actualDefaultUploadPath)).toBe(true);

    if (fs.existsSync(actualDefaultUploadPath)) {
      fs.rmSync(actualDefaultUploadPath, { recursive: true, force: true });
    }
  });
});
