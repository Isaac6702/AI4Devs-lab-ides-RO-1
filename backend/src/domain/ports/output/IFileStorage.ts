
export interface FileInput {
  fileName: string;
  mimeType: string;
  content: Buffer; // O el tipo que uses para el contenido del archivo
}

export interface IFileStorage {
  save(file: FileInput, destinationPath: string): Promise<string>; // Retorna la ruta o identificador del archivo guardado
}

