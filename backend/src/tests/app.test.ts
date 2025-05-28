import request from 'supertest';
import { app } from '../index';
import { Request, Response, NextFunction } from 'express'; // Import the necessary types

describe('GET /', () => {
    it('responds with Hola LTI!', async () => {
        // Asegúrate de que la app se inicie y se cierre correctamente para cada test o suite si es necesario
        // o que el servidor ya esté corriendo en un entorno de prueba adecuado.
        const response = await request(app).get('/');
        expect(response.statusCode).toBe(200);
        expect(response.text).toBe('Hola LTI!'); // Cambiado de "Hello World!" a "Hola LTI!"
    });
});
