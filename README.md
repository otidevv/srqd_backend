# Backend SRQD - Sistema de Reclamos, Quejas y Denuncias

Backend completo desarrollado con NestJS + PostgreSQL + Prisma para el Sistema SRQD de la UNAMAD.

## 🚀 Características Implementadas

### ✅ Sistema Completo de Producción

- [x] **Autenticación JWT** - Login seguro con tokens y guards
- [x] **Gestión de Usuarios** - CRUD completo con roles y permisos
- [x] **Módulo de Roles** - Gestión de roles del sistema
- [x] **Módulo de Sedes** - Administración de sedes universitarias
- [x] **Módulo de Dependencias** - Gestión de dependencias por sede
- [x] **Módulo de Casos SRQD** - Sistema completo de reclamos, quejas y denuncias
- [x] **Sistema de Archivos** - Upload y descarga de documentos adjuntos
- [x] **Generación de Códigos** - Códigos únicos automáticos (REC-2025-0001, etc.)
- [x] **Seguimientos** - Trazabilidad completa de cambios
- [x] **Validaciones** - Validación exhaustiva con class-validator
- [x] **Seeds de Datos** - Datos iniciales para desarrollo
- [x] **Soft Delete** - Archivado en lugar de eliminación
- [x] **Filtros Avanzados** - Búsqueda y filtrado por múltiples criterios

## 📋 Requisitos Previos

- Node.js 20+
- PostgreSQL 14+
- npm o pnpm

## 🔧 Instalación

### 1. Clonar el repositorio
```bash
cd srqd-sistema/backend
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo `.env.example` a `.env` y configura tus valores:

```bash
cp .env.example .env
```

Edita el archivo `.env`:

```env
# Database Configuration
DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/srqd_sistema?schema=public"

# JWT Configuration
JWT_SECRET="cambia_este_secreto_en_produccion_usa_algo_muy_seguro"
JWT_EXPIRATION="24h"

# Server Configuration
PORT=3000
NODE_ENV="development"

# CORS Configuration
CORS_ORIGIN="http://localhost:5173"

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DEST="./uploads"
```

### 4. Ejecutar migraciones y seeds
```bash
npx prisma migrate dev
```

Esto creará la base de datos, todas las tablas, y cargará los datos iniciales.

### 5. Iniciar el servidor
```bash
npm run start:dev
```

El servidor estará disponible en: **http://localhost:3000**

## 🔐 Usuarios de Prueba

| Email | Contraseña | Rol |
|-------|-----------|-----|
| `admin@unamad.edu.pe` | `admin123` | Admin |
| `defensoria@unamad.edu.pe` | `defensoria123` | Admin |
| `supervisor@unamad.edu.pe` | `supervisor123` | Supervisor |
| `operador1@unamad.edu.pe` | `operador123` | Operator |

## 📚 Documentación de Endpoints

### 🔐 Autenticación

#### POST /api/auth/login
Iniciar sesión (público, no requiere token)

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@unamad.edu.pe",
    "password": "admin123"
  }'
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "admin@unamad.edu.pe",
    "name": "Administrador SRQD",
    "role": "admin"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 👥 Usuarios

**Todos los endpoints requieren autenticación JWT**

#### GET /api/users
Obtener todos los usuarios

```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer TOKEN"
```

#### GET /api/users/:id
Obtener un usuario por ID

#### POST /api/users
Crear nuevo usuario

**Request:**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nuevo@unamad.edu.pe",
    "name": "Usuario Nuevo",
    "password": "password123",
    "role": "operator",
    "sedeId": "uuid-sede"
  }'
```

#### PATCH /api/users/:id
Actualizar usuario

#### DELETE /api/users/:id
Eliminar usuario

---

### 🎭 Roles

#### GET /api/roles
Listar todos los roles

#### GET /api/roles/:id
Obtener un rol por ID

#### POST /api/roles
Crear nuevo rol

**Request:**
```json
{
  "nombre": "Mediador",
  "descripcion": "Encargado de mediar casos",
  "permisos": ["LEER_CASOS", "MEDIAR_CASOS"]
}
```

#### PATCH /api/roles/:id
Actualizar rol

#### DELETE /api/roles/:id
Eliminar rol

---

### 🏢 Sedes

#### GET /api/sedes
Listar todas las sedes

#### GET /api/sedes/:id
Obtener una sede por ID

#### POST /api/sedes
Crear nueva sede

**Request:**
```json
{
  "nombre": "Sede Puerto Maldonado",
  "direccion": "Av. Jorge Chávez 1160",
  "telefono": "082-571231",
  "email": "pmaldonado@unamad.edu.pe"
}
```

#### PATCH /api/sedes/:id
Actualizar sede

#### DELETE /api/sedes/:id
Eliminar sede

---

### 🏛️ Dependencias

#### GET /api/dependencias
Listar todas las dependencias

**Con filtros:**
```bash
# Por sede
curl "http://localhost:3000/api/dependencias?sedeId=uuid-sede" \
  -H "Authorization: Bearer TOKEN"

# Por búsqueda
curl "http://localhost:3000/api/dependencias?busqueda=economía" \
  -H "Authorization: Bearer TOKEN"
```

#### GET /api/dependencias/:id
Obtener una dependencia por ID

#### GET /api/dependencias/sede/:sedeId
Obtener dependencias de una sede específica

#### POST /api/dependencias
Crear nueva dependencia

**Request:**
```json
{
  "nombre": "Facultad de Ingeniería",
  "descripcion": "Facultad de Ingeniería de Sistemas y Software",
  "codigo": "FISS",
  "sedeId": "uuid-sede",
  "responsable": "Dr. Juan Pérez",
  "email": "fiss@unamad.edu.pe",
  "telefono": "082-571234",
  "extension": "234"
}
```

#### PATCH /api/dependencias/:id
Actualizar dependencia

#### DELETE /api/dependencias/:id
Eliminar dependencia

---

### 📋 Casos SRQD (Núcleo del Sistema)

#### POST /api/casos
Crear nuevo caso (público, no requiere autenticación)

**Request:**
```bash
curl -X POST http://localhost:3000/api/casos \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "RECLAMO",
    "prioridad": "ALTA",
    "descripcionHechos": "Descripción detallada de los hechos ocurridos...",
    "derechosAfectados": "Derecho a la educación y debido proceso",
    "esAnonimo": false,
    "requiereMediacion": true,
    "esConfidencial": true,
    "etiquetas": ["académico", "calificaciones"],
    "reclamante": {
      "rolReclamante": "ESTUDIANTE",
      "tipoDocumento": "DNI",
      "numeroDocumento": "12345678",
      "nombres": "Juan",
      "apellidos": "Pérez García",
      "sexo": "MASCULINO",
      "email": "juan.perez@unamad.edu.pe",
      "telefono": "987654321",
      "carreraProfesional": "Ingeniería de Sistemas"
    },
    "reclamado": {
      "tipoReclamado": "PERSONAL",
      "nombres": "María",
      "apellidos": "González López",
      "cargoFuncion": "Docente",
      "dependencia": "Facultad de Ingeniería"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "codigo": "REC-2025-0001",
    "tipo": "RECLAMO",
    "estado": "PENDIENTE",
    "prioridad": "ALTA",
    "fechaCreacion": "2025-10-31T...",
    "fechaLimite": "2025-11-28T...",
    "reclamante": {...},
    "reclamado": {...}
  },
  "message": "Caso REC-2025-0001 creado exitosamente"
}
```

#### GET /api/casos
Listar todos los casos (requiere autenticación)

**Con filtros avanzados:**
```bash
# Por tipo
curl "http://localhost:3000/api/casos?tipo=RECLAMO" \
  -H "Authorization: Bearer TOKEN"

# Por estado
curl "http://localhost:3000/api/casos?estado=PENDIENTE" \
  -H "Authorization: Bearer TOKEN"

# Por prioridad
curl "http://localhost:3000/api/casos?prioridad=ALTA" \
  -H "Authorization: Bearer TOKEN"

# Por fechas
curl "http://localhost:3000/api/casos?fechaDesde=2025-01-01&fechaHasta=2025-12-31" \
  -H "Authorization: Bearer TOKEN"

# Búsqueda de texto
curl "http://localhost:3000/api/casos?busqueda=calificaciones" \
  -H "Authorization: Bearer TOKEN"

# Combinación de filtros
curl "http://localhost:3000/api/casos?tipo=RECLAMO&estado=PENDIENTE&prioridad=ALTA" \
  -H "Authorization: Bearer TOKEN"
```

#### GET /api/casos/estadisticas
Obtener estadísticas de casos

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "porTipo": [
      { "tipo": "RECLAMO", "_count": 80 },
      { "tipo": "QUEJA", "_count": 50 },
      { "tipo": "DENUNCIA", "_count": 20 }
    ],
    "porEstado": [
      { "estado": "PENDIENTE", "_count": 45 },
      { "estado": "EN_PROCESO", "_count": 60 },
      { "estado": "RESUELTO", "_count": 40 }
    ],
    "porPrioridad": [
      { "prioridad": "ALTA", "_count": 30 },
      { "prioridad": "MEDIA", "_count": 90 },
      { "prioridad": "BAJA", "_count": 30 }
    ]
  }
}
```

#### GET /api/casos/codigo/:codigo
Buscar caso por código (ej: REC-2025-0001)

#### GET /api/casos/:id
Obtener un caso por ID

#### PATCH /api/casos/:id
Actualizar caso

**Request:**
```json
{
  "estado": "EN_PROCESO",
  "prioridad": "ALTA",
  "resolucion": "Se realizó la investigación correspondiente..."
}
```

#### POST /api/casos/:id/asignar
Asignar caso a un usuario

**Request:**
```json
{
  "asignadoA": "uuid-usuario"
}
```

#### POST /api/casos/:id/seguimientos
Agregar seguimiento al caso

**Request:**
```json
{
  "accion": "Investigación realizada",
  "comentario": "Se entrevistó al reclamado y se recopilaron pruebas...",
  "esVisible": true
}
```

#### DELETE /api/casos/:id
Archivar caso (soft delete)

---

### 📎 Archivos

#### POST /api/archivos/upload/:casoId
Subir archivo a un caso

**Request (multipart/form-data):**
```bash
curl -X POST http://localhost:3000/api/archivos/upload/uuid-caso \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@documento.pdf"
```

**Tipos permitidos:**
- PDF (application/pdf)
- Imágenes (image/jpeg, image/jpg, image/png)
- Word (.doc, .docx)
- Excel (.xls, .xlsx)

**Tamaño máximo:** 10MB (configurable en .env)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "casoId": "uuid-caso",
    "nombre": "documento.pdf",
    "url": "/uploads/uuid-filename.pdf",
    "tipo": "application/pdf",
    "tamano": 245678,
    "fechaSubida": "2025-10-31T..."
  },
  "message": "Archivo subido exitosamente"
}
```

#### GET /api/archivos/caso/:casoId
Listar archivos de un caso

#### GET /api/archivos/:id
Obtener información de un archivo

#### GET /api/archivos/:id/download
Descargar un archivo

```bash
curl -X GET http://localhost:3000/api/archivos/uuid/download \
  -H "Authorization: Bearer TOKEN" \
  -o archivo-descargado.pdf
```

#### DELETE /api/archivos/:id
Eliminar archivo

---

## 🗂️ Estructura del Proyecto

```
backend/
├── src/
│   ├── auth/              # Autenticación JWT
│   │   ├── guards/        # Guards de autenticación
│   │   ├── decorators/    # Decoradores personalizados
│   │   └── strategies/    # Estrategias de Passport
│   ├── users/             # Módulo de usuarios
│   ├── roles/             # Módulo de roles
│   ├── sedes/             # Módulo de sedes
│   ├── dependencias/      # Módulo de dependencias
│   ├── casos/             # Módulo de casos SRQD
│   │   ├── dto/           # DTOs con validación
│   │   │   ├── create-reclamante.dto.ts
│   │   │   ├── create-reclamado.dto.ts
│   │   │   ├── create-caso.dto.ts
│   │   │   └── update-caso.dto.ts
│   │   ├── casos.controller.ts
│   │   ├── casos.service.ts
│   │   └── casos.module.ts
│   ├── archivos/          # Módulo de archivos
│   ├── prisma/            # Configuración de Prisma
│   └── app.module.ts      # Módulo raíz
├── prisma/
│   ├── schema.prisma      # Schema de base de datos
│   ├── seed.ts            # Seeds de datos iniciales
│   └── migrations/        # Migraciones
├── uploads/               # Directorio de archivos subidos
├── .env                   # Variables de entorno (no en git)
├── .env.example           # Template de variables
└── package.json
```

## 🎯 Lógica de Negocio Importante

### Generación de Códigos Únicos

Los casos generan códigos automáticos con el formato: `TIPO-AÑO-SECUENCIA`

- **RECLAMO:** REC-2025-0001, REC-2025-0002, ...
- **QUEJA:** QUE-2025-0001, QUE-2025-0002, ...
- **DENUNCIA:** DEN-2025-0001, DEN-2025-0002, ...

La secuencia es independiente por tipo y se reinicia cada año.

### Cálculo de Fecha Límite

Los casos tienen una fecha límite calculada automáticamente:
- **20 días hábiles ≈ 28 días calendario** desde la fecha de creación
- Configurable en `casos.service.ts:calcularFechaLimite()`

### Estados de Caso

Los casos transitan por los siguientes estados:

1. **PENDIENTE** - Caso recién creado
2. **EN_REVISION** - Caso siendo revisado
3. **EN_PROCESO** - Caso en investigación
4. **EN_MEDIACION** - Caso en proceso de mediación
5. **RESUELTO** - Caso resuelto exitosamente
6. **RECHAZADO** - Caso rechazado
7. **ARCHIVADO** - Caso archivado (soft delete)

### Seguimientos (Audit Trail)

El sistema crea seguimientos automáticos para:
- Creación de casos
- Cambios de estado
- Asignación de casos a usuarios
- Resolución de casos

Los seguimientos manuales pueden agregarse con `POST /api/casos/:id/seguimientos`

### Tipos de Reclamante

- **ESTUDIANTE** - Requiere carreraProfesional
- **EGRESADO** - Requiere carreraProfesional
- **DOCENTE** - Requiere departamentoAcademico
- **ADMINISTRATIVO** - Requiere dependencia
- **EXTERNO** - Sin campos adicionales

### Validaciones

El sistema valida exhaustivamente:
- Tipos de archivo permitidos
- Tamaño máximo de archivos (10MB por defecto)
- Existencia de casos antes de subir archivos
- Longitud mínima de descripciones (20 caracteres)
- Formatos de email, teléfono, documentos
- Permisos de usuario según rol

## 🧪 Testing

### Test con cURL

#### 1. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@unamad.edu.pe","password":"admin123"}'
```

Guarda el token recibido en una variable:
```bash
export TOKEN="eyJhbGc..."
```

#### 2. Crear un caso
```bash
curl -X POST http://localhost:3000/api/casos \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "RECLAMO",
    "descripcionHechos": "Test de creación de caso desde cURL",
    "reclamante": {
      "rolReclamante": "ESTUDIANTE",
      "tipoDocumento": "DNI",
      "numeroDocumento": "12345678",
      "nombres": "Test",
      "apellidos": "Usuario",
      "sexo": "MASCULINO",
      "email": "test@unamad.edu.pe",
      "telefono": "987654321",
      "carreraProfesional": "Ingeniería de Sistemas"
    }
  }'
```

#### 3. Listar casos
```bash
curl -X GET http://localhost:3000/api/casos \
  -H "Authorization: Bearer $TOKEN"
```

#### 4. Subir archivo
```bash
curl -X POST http://localhost:3000/api/archivos/upload/ID_DEL_CASO \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@documento.pdf"
```

### Test con Postman

1. Importa la colección desde `postman/SRQD.postman_collection.json` (próximamente)
2. Configura la variable de entorno `baseUrl` a `http://localhost:3000/api`
3. Ejecuta el login y guarda el token automáticamente
4. Prueba todos los endpoints con los datos de ejemplo

## 🚀 Despliegue en Producción

### 1. Variables de Entorno

**Importante:** Cambia estos valores en producción:

```env
NODE_ENV="production"
DATABASE_URL="postgresql://usuario:password@host:5432/srqd_prod"
JWT_SECRET="genera_un_secreto_muy_largo_y_seguro_aqui"
JWT_EXPIRATION="8h"
CORS_ORIGIN="https://tu-frontend.com"
MAX_FILE_SIZE=5242880
```

### 2. Build del Proyecto

```bash
npm run build
```

### 3. Ejecutar Migraciones

```bash
npx prisma migrate deploy
```

### 4. Iniciar Servidor

```bash
npm run start:prod
```

### 5. Configurar Nginx (Opcional)

```nginx
server {
    listen 80;
    server_name api.tudominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads/ {
        alias /ruta/al/backend/uploads/;
    }
}
```

### 6. Process Manager (PM2)

```bash
npm install -g pm2
pm2 start dist/main.js --name srqd-backend
pm2 startup
pm2 save
```

## 🔗 Integración con Frontend

### Configuración de Axios

```typescript
// api/axios.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

// Interceptor para agregar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### Ejemplo de Uso en React

```typescript
// Login
const login = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  localStorage.setItem('token', response.data.token);
  return response.data;
};

// Crear caso
const createCaso = async (casoData: CreateCasoDto) => {
  const response = await api.post('/casos', casoData);
  return response.data;
};

// Listar casos
const getCasos = async (filters?: CasoFilters) => {
  const response = await api.get('/casos', { params: filters });
  return response.data;
};

// Subir archivo
const uploadFile = async (casoId: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post(`/archivos/upload/${casoId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};
```

## 🔄 Prisma Studio

Para explorar la base de datos visualmente:

```bash
npx prisma studio
```

Abrirá una interfaz web en `http://localhost:5555`

## 📦 Tecnologías

- **NestJS 11** - Framework backend progresivo
- **PostgreSQL** - Base de datos relacional
- **Prisma 6** - ORM moderno con TypeScript
- **TypeScript 5** - Tipado estático
- **JWT + Passport** - Autenticación
- **bcrypt** - Hash de contraseñas
- **Multer** - Upload de archivos
- **class-validator** - Validación de DTOs
- **class-transformer** - Transformación de datos
- **UUID** - Generación de IDs únicos

## 📝 Scripts Disponibles

```bash
npm run start          # Iniciar en modo producción
npm run start:dev      # Iniciar en modo desarrollo (hot-reload)
npm run start:debug    # Iniciar en modo debug
npm run build          # Compilar proyecto
npm run format         # Formatear código con Prettier
npm run lint           # Ejecutar linter

# Prisma
npx prisma migrate dev      # Crear y aplicar migración
npx prisma migrate deploy   # Aplicar migraciones en producción
npx prisma studio           # Abrir Prisma Studio
npx prisma db seed          # Ejecutar seeds manualmente
npx prisma generate         # Generar cliente de Prisma
```

## 🛡️ Seguridad

- ✅ Passwords hasheados con bcrypt (10 salt rounds)
- ✅ JWT con expiración configurable
- ✅ Guards para protección de rutas
- ✅ Validación exhaustiva de inputs
- ✅ CORS configurado
- ✅ Sanitización de archivos subidos
- ✅ Límites de tamaño de archivos
- ✅ Variables sensibles en .env (excluido de git)
- ✅ Soft delete para casos críticos

## 🐛 Troubleshooting

### Error: "Cannot connect to database"
Verifica que PostgreSQL esté corriendo y que las credenciales en `.env` sean correctas.

### Error: "Module not found"
Ejecuta `npm install` para instalar todas las dependencias.

### Error: "Port 3000 already in use"
Cambia el puerto en `.env` o cierra la aplicación que está usando el puerto 3000.

### Archivos no se suben
Verifica que el directorio `./uploads` tenga permisos de escritura.

## 📄 Licencia

Proyecto desarrollado para la **Universidad Nacional Amazónica de Madre de Dios (UNAMAD)**.

---

**Desarrollado con ❤️ para mejorar la gestión de reclamos, quejas y denuncias en la UNAMAD**
