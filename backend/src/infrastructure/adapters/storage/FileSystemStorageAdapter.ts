import * as fs from 'fs';
import * as path from 'path';
import { IFileStorage, FileInput } from '../../../domain/ports/output/IFileStorage';

export class FileSystemStorageAdapter implements IFileStorage {
  // Define el directorio base para todas las cargas, relativo a la raíz del proyecto backend.
  // __dirname es src/infrastructure/adapters/storage, así que subimos 4 niveles para llegar a backend/
  private baseUploadPath = path.resolve(__dirname, '../../../../uploads');

  constructor() {
    // Asegurarse de que el directorio base de uploads exista al instanciar
    if (!fs.existsSync(this.baseUploadPath)) {
      fs.mkdirSync(this.baseUploadPath, { recursive: true });
    }
  }

  async save(file: FileInput, destinationSubdirectory: string): Promise<string> {
    try {
      const targetDirectory = path.join(this.baseUploadPath, destinationSubdirectory);

      // Asegurarse de que el subdirectorio de destino exista
      if (!fs.existsSync(targetDirectory)) {
        fs.mkdirSync(targetDirectory, { recursive: true });
      }

      // Generar un nombre de archivo único o sanitizar el existente para evitar problemas.
      // Por simplicidad, aquí usamos el nombre original, pero en producción considera añadir un timestamp o UUID.
      // También es importante sanitizar file.fileName para evitar ataques de path traversal si no se controla estrictamente.
      const fileName = path.basename(file.fileName); // path.basename ayuda a prevenir path traversal básico
      const filePath = path.join(targetDirectory, fileName);

      await fs.promises.writeFile(filePath, file.content);

      // Devolver la ruta relativa al directorio base de uploads o una ruta que sea útil para la aplicación
      const relativePath = path.join(destinationSubdirectory, fileName);

      // En Windows, path.join puede usar \. Asegurémonos de que sean /
      return relativePath.split(path.sep).join('/');

    } catch (error) {
      console.error('Error saving file to filesystem:', error);
      // Considera si quieres eliminar el archivo si algo falla después de crearlo parcialmente.
      throw new Error('Could not save file to filesystem.');
    }
  }
}

