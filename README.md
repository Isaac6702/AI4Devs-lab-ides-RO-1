# LTI - Sistema de Seguimiento de Talento

Este proyecto es una aplicación full-stack con un frontend en React y un backend en Express usando Prisma como ORM. El frontend se inicia con Create React App y el backend está escrito en TypeScript. Permite gestionar candidatos, incluyendo la carga y almacenamiento de sus CVs.

## Características Principales

- Gestión de candidatos con almacenamiento de información personal
- Carga y almacenamiento de archivos CV
- Arquitectura hexagonal (puertos y adaptadores) en el backend
- Interfaz de usuario intuitiva para añadir candidatos

## Explicación de Directorios y Archivos

- `backend/`: Contiene el código del lado del servidor escrito en Node.js.
  - `src/`: Contiene el código fuente para el backend.
    - `index.ts`: El punto de entrada para el servidor backend.
    - `domain/`: Contiene las entidades del dominio y los casos de uso (arquitectura hexagonal)
      - `entities/`: Definiciones de entidades como Candidate
      - `ports/`: Interfaces para repositorios y servicios externos
      - `use-cases/`: Casos de uso de la aplicación, como AddCandidateUseCase
    - `infrastructure/`: Implementaciones concretas de los puertos
      - `adapters/`: Adaptadores para bases de datos, almacenamiento de archivos, etc.
        - `controllers/`: Controladores de API
        - `persistence/`: Implementaciones de repositorios usando Prisma
        - `storage/`: Adaptadores para el almacenamiento de archivos
      - `routes/`: Definiciones de rutas de la API
  - `prisma/`: Contiene el esquema de Prisma para ORM y migraciones.
  - `uploads/`: Directorio donde se almacenan los archivos CV subidos.
  - `tests/`: Pruebas unitarias e integración para el backend.
  - `tsconfig.json`: Archivo de configuración de TypeScript.
  - `.env`: Contiene las variables de entorno.
- `frontend/`: Contiene el código del lado del cliente escrito en React.
  - `src/`: Contiene el código fuente para el frontend.
    - `components/`: Componentes React, incluyendo AddCandidateForm para añadir candidatos
  - `public/`: Contiene archivos estáticos como el archivo HTML e imágenes.
  - `build/`: Contiene la construcción lista para producción del frontend.
- `docker-compose.yml`: Contiene la configuración de Docker Compose para gestionar los servicios de tu aplicación.
- `dummy-cv.pdf`: Archivo de ejemplo para probar la funcionalidad de carga de CV.
- `README.md`: Este archivo contiene información sobre el proyecto e instrucciones sobre cómo ejecutarlo.

## Arquitectura del Proyecto

El proyecto sigue una arquitectura hexagonal (también conocida como puertos y adaptadores) en el backend, lo que permite una clara separación de responsabilidades y facilita las pruebas.

### Frontend

El frontend es una aplicación React y sus archivos principales están ubicados en el directorio `src`. Incluye un formulario para añadir candidatos con capacidad de carga de archivos CV.

### Backend

El backend es una aplicación Express escrita en TypeScript con la siguiente estructura:

- **Dominio**: Contiene la lógica de negocio pura, independiente de infraestructura.
  - Entidades: Representaciones de conceptos del dominio (Candidate)
  - Puertos: Interfaces que define el dominio para interactuar con el exterior
  - Casos de Uso: Implementan la lógica de negocio (AddCandidateUseCase)
  
- **Infraestructura**: Implementaciones concretas de los puertos.
  - Controladores: Gestión de peticiones HTTP (CandidateController)
  - Repositorios: Persistencia de datos usando Prisma (PrismaCandidateRepository)
  - Almacenamiento: Gestión de archivos CV (FileSystemStorageAdapter)
  - Rutas: Definición de endpoints API (candidateRoutes)

## Primeros Pasos

Para comenzar con este proyecto, sigue estos pasos:

1. Clona el repositorio.
2. Instala las dependencias para el frontend y el backend:
```sh
cd frontend
npm install

cd ../backend
npm install
```
3. Configura la base de datos (ver sección Docker y PostgreSQL).
4. Aplica las migraciones de Prisma:
```sh
cd backend
npx prisma migrate dev
```
5. Construye el servidor backend:
```
cd backend
npm run build
```
6. Inicia el servidor backend:
```
cd backend
npm run dev 
```

7. En una nueva ventana de terminal, inicia el servidor frontend:
```
cd frontend
npm start
```

El servidor backend estará corriendo en http://localhost:3010 y el frontend estará disponible en http://localhost:3000.

## Docker y PostgreSQL

Este proyecto usa Docker para ejecutar una base de datos PostgreSQL. Así es cómo ponerlo en marcha:

Instala Docker en tu máquina si aún no lo has hecho. Puedes descargarlo desde aquí.
Navega al directorio raíz del proyecto en tu terminal.
Ejecuta el siguiente comando para iniciar el contenedor Docker:
```
docker-compose up -d
```
Esto iniciará una base de datos PostgreSQL en un contenedor Docker. La bandera -d corre el contenedor en modo separado, lo que significa que se ejecuta en segundo plano.

Para acceder a la base de datos PostgreSQL, puedes usar cualquier cliente PostgreSQL con los siguientes detalles de conexión:
 - Host: localhost
 - Port: 5432
 - User: postgres
 - Password: password
 - Database: mydatabase

Por favor, reemplaza User, Password y Database con el usuario, la contraseña y el nombre de la base de datos reales especificados en tu archivo .env.

Para detener el contenedor Docker, ejecuta el siguiente comando:
```
docker-compose down
```

## Pruebas

El proyecto incluye pruebas unitarias y de integración para el backend:

```sh
cd backend
npm test
```

Para generar informes de cobertura:

```sh
cd backend
npm run test:coverage
```

## API Endpoints

- **POST /api/candidates**: Añade un nuevo candidato con un archivo CV
  - Requiere un formulario multipart con datos del candidato y archivo CV

## Tecnologías utilizadas

- **Frontend**: React, TypeScript, CSS
- **Backend**: Node.js, Express, TypeScript
- **Base de datos**: PostgreSQL
- **ORM**: Prisma
- **Testing**: Jest
- **Virtualización**: Docker

