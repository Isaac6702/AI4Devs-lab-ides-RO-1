# Modelo de Datos del Backend

Este documento describe los modelos de datos utilizados en el backend del proyecto LTI - Sistema de Seguimiento de Talento, definidos en el archivo `prisma/schema.prisma`.

## 1. Modelo `User`

Representa a un usuario del sistema. Actualmente es un modelo básico, pero podría extenderse para incluir roles y permisos.

### Campos:

- `id` (Int): Identificador único del usuario (clave primaria, autoincremental).
- `email` (String): Dirección de correo electrónico única del usuario.
- `name` (String?): Nombre del usuario (opcional).

```prisma
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
  // Potentially add a role for authorization:
  // role  Role    @default(USER)
}
```

## 2. Modelo `Candidate`

Representa a un candidato en el sistema de seguimiento de talento. Almacena información personal, de contacto, profesional y la ruta a su CV.

### Campos:

- `id` (Int): Identificador único del candidato (clave primaria, autoincremental).
- `firstName` (String): Nombre del candidato.
- `lastName` (String): Apellido del candidato.
- `email` (String): Dirección de correo electrónico única del candidato.
- `phone` (String?): Número de teléfono del candidato (opcional).
- `address` (String?): Dirección del candidato (opcional).
- `education` (String?): Información sobre la educación del candidato (opcional). Se podría considerar el tipo JSON para datos estructurados.
- `workExperience` (String?): Información sobre la experiencia laboral del candidato (opcional). Se podría considerar el tipo JSON para datos estructurados.
- `cvPath` (String?): Ruta al archivo del Curriculum Vitae del candidato almacenado en el sistema (opcional).
- `createdAt` (DateTime): Fecha y hora de creación del registro del candidato (valor por defecto: ahora).
- `updatedAt` (DateTime): Fecha y hora de la última actualización del registro del candidato (se actualiza automáticamente).

```prisma
model Candidate {
  id              Int      @id @default(autoincrement())
  firstName       String
  lastName        String
  email           String   @unique
  phone           String?
  address         String?
  education       String? // Consider JSON type if your DB supports it and you need structured data
  workExperience  String? // Consider JSON type for structured data
  cvPath          String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  // Optional: Link to the User who created/owns this candidate (if applicable)
  // recruiterId   Int?
  // recruiter     User?    @relation(fields: [recruiterId], references: [id])
}
```

---

Este documento debe mantenerse actualizado si se realizan cambios en el `schema.prisma`.

