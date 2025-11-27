const express = require("express");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 3000;

// Clave secreta para firmar los tokens JWT (en producción debe estar en variable de entorno)
const JWT_SECRET = "tu_clave_secreta_super_segura_12345";

app.use(cors());
app.use(express.json());

// Base de datos simulada de usuarios (en un proyecto real usar una base de datos)
const users = [
    { id: 1, email: "admin@example.com", password: "admin123", name: "Administrador" },
    { id: 2, email: "user@example.com", password: "user123", name: "Usuario" }
];

// Middleware de autenticación - verifica el token JWT
const authenticateToken = (req, res, next) => {
    // Obtener el token del header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Acceso denegado. Token no proporcionado."
        });
    }

    // Verificar el token
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: "Token inválido o expirado."
            });
        }

        // Token válido - guardar datos del usuario en la request
        req.user = user;
        next();
    });
};

// Endpoint de autenticación
app.post("/api/login", (req, res) => {
    const { email, password } = req.body;

    // Validar que se enviaron los campos requeridos
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email y contraseña son requeridos"
        });
    }

    // Buscar usuario en la base de datos
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        // Usuario encontrado - generar token JWT
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                name: user.name
            },
            JWT_SECRET,
            { expiresIn: "24h" } // Token válido por 24 horas
        );

        // Login exitoso - devolver token y datos del usuario
        res.json({
            success: true,
            message: "Login exitoso",
            token: token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        });
    } else {
        // Credenciales incorrectas
        res.status(401).json({
            success: false,
            message: "Email o contraseña incorrectos"
        });
    }
});

// Ruta para JSON dentro de carpetas (cats, cart, cats_products)
// PROTEGIDA - requiere token JWT válido
app.get("/json/:folder/:file", authenticateToken, (req, res) => {
    const folder = req.params.folder;
    const file = req.params.file;

    const filePath = path.join(__dirname, "data", folder, file);

    res.sendFile(filePath, (err) => {
        if (err) {
            console.log(err);
            res.status(404).json({ error: "Archivo no encontrado" });
        }
    });
});

console.log(__dirname);
// Iniciar server
app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});