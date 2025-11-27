# Sistema de Autenticación con JWT - Backend eCommerce

## Descripción
Este backend implementa un sistema de autenticación basado en JSON Web Tokens (JWT) que protege el acceso a los recursos del eCommerce.

## Inicio Rápido

### Windows:
```bash
start.bat
```

### Linux/Mac:
```bash
node app.js
```

El servidor se iniciará en http://localhost:3000

## Características Implementadas

### 1. Endpoint de Login
- **Ruta:** `POST /api/login`
- **Descripción:** Autentica al usuario y genera un token JWT
- **Body requerido:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
- **Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "Usuario"
  }
}
```
- **Respuesta error (401):**
```json
{
  "success": false,
  "message": "Email o contraseña incorrectos"
}
```

### 2. Middleware de Autenticación
- **Función:** `authenticateToken`
- **Descripción:** Verifica la presencia y validez del token JWT en cada petición
- **Header requerido:** `Authorization: Bearer <token>`
- **Validaciones:**
  - Token presente en el header
  - Token válido y no expirado
  - Token firmado con la clave secreta correcta

### 3. Rutas Protegidas
Todas las rutas de datos del eCommerce están protegidas:
- `GET /json/:folder/:file` - Requiere token JWT válido

### 4. Usuarios de Prueba
```javascript
// Usuario Admin
Email: admin@example.com
Password: admin123

// Usuario Normal
Email: user@example.com
Password: user123
```

## Configuración del Token JWT

- **Tiempo de expiración:** 24 horas
- **Algoritmo:** HS256
- **Clave secreta:** Definida en `JWT_SECRET` (debe moverse a variables de entorno en producción)

## Flujo de Autenticación

1. **Login:** Usuario envía credenciales → Backend valida → Genera token JWT
2. **Almacenamiento:** Frontend guarda el token en sessionStorage
3. **Peticiones:** Frontend incluye token en header `Authorization: Bearer <token>`
4. **Validación:** Middleware verifica el token antes de permitir acceso
5. **Expiración:** Si el token expira o es inválido, usuario es redirigido al login

## Integración Frontend

El frontend ([FinalG1](../FinalG1)) está configurado para:
- Enviar credenciales al endpoint `/api/login`
- Guardar el token en sessionStorage
- Incluir el token en todas las peticiones a través de `getJSONData()`
- Manejar errores 401/403 redirigiendo al login

## Seguridad

### Implementado:
- Tokens JWT con expiración
- Validación de tokens en cada petición
- Mensajes de error apropiados
- Limpieza de sesión al expirar

### Recomendaciones para producción:
- Mover `JWT_SECRET` a variables de entorno
- Usar HTTPS
- Implementar refresh tokens
- Hash de contraseñas con bcrypt
- Rate limiting en el endpoint de login
- Usar base de datos real en lugar de array en memoria
