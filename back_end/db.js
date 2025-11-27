// =============================================
// db.js - Conexión a MySQL
// =============================================

const mysql = require('mysql2/promise');

// CONFIGURACIÓN DE LA BASE DE DATOS
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',           // Coloca tu contraseña
    database: 'ecommerce'
};

// Crear conexión
const pool = mysql.createPool(dbConfig);

// Función para probar conexión
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conectado a MySQL correctamente');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Error al conectar a MySQL:', error.message);
        return false;
    }
}

module.exports = { pool, testConnection };