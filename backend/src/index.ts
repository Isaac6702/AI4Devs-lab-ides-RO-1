import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import candidateRoutes from './infrastructure/routes/candidateRoutes'; // Importar rutas de candidatos

dotenv.config();

export const app: Express = express();
const port = process.env.PORT || 3010;

// Middlewares para parsear el cuerpo de las solicitudes
app.use(express.json()); // Para parsear application/json
app.use(express.urlencoded({ extended: true })); // Para parsear application/x-www-form-urlencoded

app.get('/', (req: Request, res: Response) => {
  res.send('Hola LTI!');
});

// Montar las rutas de candidatos
app.use('/api/candidates', candidateRoutes);

// Middleware de manejo de errores global (opcional pero recomendado)
// Este capturará errores que no se manejen en las rutas específicas (ej. errores de Multer no capturados en candidateRoutes)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[GlobalErrorHandler] An error occurred:', err);
  // Si el error ya tiene un statusCode (como los de Multer o errores HTTP), úsalo.
  // De lo contrario, es un error 500 inesperado.
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(statusCode).json({ message });
});

if (process.env.NODE_ENV !== 'test') { // Evitar que el servidor inicie durante los tests de Jest
  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
}
