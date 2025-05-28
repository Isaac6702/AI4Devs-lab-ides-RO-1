# Manifiesto de Buenas Prácticas

Este documento describe las buenas prácticas de desarrollo implementadas en el proyecto LTI - Sistema de Seguimiento de Talento, especialmente aquellas reforzadas durante la implementación de la funcionalidad de gestión de candidatos.

## 1. Arquitectura Hexagonal (Puertos y Adaptadores)

Se ha adoptado una arquitectura hexagonal para el backend. Esto implica una clara separación entre el núcleo de la lógica de negocio (dominio) y los componentes de infraestructura (adaptadores).

- **Dominio (`backend/src/domain`)**:
    - **Entidades**: Representan los objetos centrales del negocio (ej. `Candidate`). Son agnósticas a la tecnología de persistencia o frameworks.
    - **Puertos**: Definen interfaces para las dependencias externas (ej. `ICandidateRepository`, `IFileStorage`). El dominio define *qué* se necesita, no *cómo* se implementa.
    - **Casos de Uso**: Orquestan la lógica de negocio utilizando entidades y puertos (ej. `AddCandidateUseCase`). Representan las acciones que el sistema puede realizar.

- **Infraestructura (`backend/src/infrastructure`)**:
    - **Adaptadores**: Implementaciones concretas de los puertos definidos por el dominio.
        - `controllers`: Adaptadores para la entrada de peticiones HTTP (ej. `CandidateController`).
        - `persistence`: Adaptadores para la persistencia de datos (ej. `PrismaCandidateRepository` usando Prisma ORM).
        - `storage`: Adaptadores para servicios externos como el almacenamiento de archivos (ej. `FileSystemStorageAdapter`).
    - **Rutas**: Definen los endpoints de la API y los conectan con los controladores.

**Beneficios**:
- **Testeabilidad**: El dominio puede ser probado de forma aislada, sin dependencias de frameworks o bases de datos.
- **Mantenibilidad**: Los cambios en la infraestructura (ej. cambiar de base de datos) tienen un impacto mínimo en la lógica de negocio.
- **Flexibilidad**: Facilita la adición de nuevos adaptadores o la modificación de los existentes.

## 2. Desarrollo Dirigido por Pruebas (Test-Driven Development - TDD) y Pruebas Exhaustivas

Aunque no se siguió un ciclo TDD estricto para todas las partes, se puso un fuerte énfasis en la creación de pruebas para asegurar la calidad y robustez del código.

- **Pruebas Unitarias**: Se crearon pruebas para los casos de uso del dominio (`AddCandidateUseCase.test.ts`) y para los adaptadores de infraestructura de forma aislada (ej. `PrismaCandidateRepository.test.ts`, `FileSystemStorageAdapter.test.ts`).
- **Pruebas de Integración**: Se probaron las interacciones entre diferentes componentes, como las rutas de la API y su conexión con los controladores y casos de uso (`candidateAPI.test.ts`, `PrismaCandidateRepository.integration.test.ts`).
- **Cobertura de Pruebas**: Se configuró la generación de informes de cobertura (`npm run test:coverage`) para identificar áreas del código que requieren más pruebas.

**Beneficios**:
- **Confianza en los Cambios**: Las pruebas actúan como una red de seguridad al refactorizar o añadir nuevas funcionalidades.
- **Documentación Viva**: Las pruebas sirven como ejemplos de cómo usar los diferentes componentes del sistema.
- **Mejora del Diseño**: Escribir pruebas a menudo conduce a un diseño de código más modular y desacoplado.

## 3. Nomenclatura Clara y Consistente

Se ha procurado utilizar nombres descriptivos y consistentes para archivos, carpetas, clases, métodos y variables. Esto mejora la legibilidad y la comprensión del código.

- **Ejemplos**: `AddCandidateUseCase`, `CandidateController`, `ICandidateRepository`, `FileSystemStorageAdapter`.

## 4. Separación de Responsabilidades (Single Responsibility Principle - SRP)

Cada componente (clase, módulo) tiene una responsabilidad única y bien definida.

- Los casos de uso se encargan de la lógica de negocio.
- Los controladores manejan las peticiones HTTP y la validación básica.
- Los repositorios se encargan de la interacción con la base de datos.
- Los adaptadores de almacenamiento gestionan la subida y guardado de archivos.

## 5. Uso de un ORM (Prisma)

Prisma se utiliza como Object-Relational Mapper para interactuar con la base de datos PostgreSQL.

- **Esquema Definido**: El esquema de la base de datos se define en `prisma/schema.prisma`, proporcionando una única fuente de verdad.
- **Migraciones**: Prisma Migrate gestiona las migraciones de la base de datos de forma segura y versionada.
- **Tipado Seguro**: Prisma Client ofrece tipado seguro para las consultas a la base de datos, reduciendo errores en tiempo de ejecución.

## 6. Manejo de Archivos Estructurado

La funcionalidad de carga de CVs se implementó con una clara separación:

- El controlador recibe el archivo.
- El caso de uso coordina el guardado del archivo y la creación del candidato.
- Un adaptador de almacenamiento (`FileSystemStorageAdapter`) se encarga específicamente de la lógica de guardar el archivo en el sistema de ficheros.

## 7. Variables de Entorno

Configuraciones sensibles o específicas del entorno (como credenciales de base de datos) se gestionan a través de variables de entorno (archivo `.env`), no se hardcodean en el código.

## 8. Estructura de Proyecto Organizada

El proyecto sigue una estructura de carpetas lógica que separa el frontend del backend, y dentro del backend, distingue claramente entre dominio, infraestructura, pruebas, etc.

---

Este manifiesto sirve como guía y recordatorio de los estándares de calidad que buscamos mantener en el desarrollo de este proyecto. Se espera que estas prácticas se sigan y se promuevan en futuras contribuciones.

