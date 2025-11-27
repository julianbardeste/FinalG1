-- =============================================
-- PASO 1: CREAR LA BASE DE DATOS
-- =============================================

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS ecommerce;

-- Seleccionar la base de datos
USE ecommerce;

-- =============================================
-- PASO 2: CREAR TABLA DE USUARIOS
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- PASO 3: CREAR TABLA DE CARRITOS
-- =============================================
CREATE TABLE IF NOT EXISTS carts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_amount DECIMAL(10, 2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =============================================
-- PASO 4: CREAR TABLA DE PRODUCTOS DEL CARRITO
-- =============================================
CREATE TABLE IF NOT EXISTS cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_image VARCHAR(500),
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES carts(id)
);

-- =============================================
-- PASO 5: CREAR TABLA DE INFORMACIÓN DE ENVÍO
-- =============================================
CREATE TABLE IF NOT EXISTS shipping_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT NOT NULL,
    street VARCHAR(255) NOT NULL,
    number VARCHAR(50) NOT NULL,
    corner VARCHAR(255),
    department VARCHAR(100) NOT NULL,
    locality VARCHAR(100) NOT NULL,
    shipping_cost DECIMAL(10, 2) NOT NULL,
    shipping_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES carts(id)
);

-- =============================================
-- PASO 6: INSERTAR USUARIOS DE PRUEBA
-- =============================================
INSERT INTO users (id, email, password, name) VALUES 
(1, 'admin@example.com', 'admin123', 'Administrador'),
(2, 'user@example.com', 'user123', 'Usuario');

-- =============================================
-- PASO 7: VERIFICAR QUE TODO SE CREÓ
-- =============================================
SELECT 'Base de datos creada exitosamente!' as Mensaje;
SHOW TABLES;