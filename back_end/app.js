const express = require("express");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");
const { pool, testConnection } = require("./db");

const app = express();
const PORT = 3000;

const JWT_SECRET = "tu_clave_secreta_super_segura_12345";

app.use(cors());
app.use(express.json());

const users = [
    { id: 1, email: "admin@example.com", password: "admin123", name: "Administrador" },
    { id: 2, email: "user@example.com", password: "user123", name: "Usuario" }
];

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Token no proporcionado"
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: "Token invalido"
            });
        }
        req.user = user;
        next();
    });
};

app.post("/api/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email y contrasena requeridos"
        });
    }

    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name },
            JWT_SECRET,
            { expiresIn: "24h" }
        );

        res.json({
            success: true,
            message: "Login exitoso",
            token: token,
            user: { id: user.id, email: user.email, name: user.name }
        });
    } else {
        res.status(401).json({
            success: false,
            message: "Email o contrasena incorrectos"
        });
    }
});

app.post("/api/cart", authenticateToken, async (req, res) => {
    let connection;
    
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const { items, shippingInfo } = req.body;
        const userId = req.user.id;

        if (!items || items.length === 0) {
            throw new Error('Carrito vacio');
        }
        if (!shippingInfo) {
            throw new Error('Falta info de envio');
        }

        let total = 0;
        items.forEach(item => {
            total += item.count * item.unitCost;
        });
        total += parseFloat(shippingInfo.shippingCost || 0);

        const [cartResult] = await connection.query(
            'INSERT INTO carts (user_id, total_amount, currency) VALUES (?, ?, ?)',
            [userId, total.toFixed(2), items[0].currency || 'USD']
        );
        const cartId = cartResult.insertId;

        for (const item of items) {
            await connection.query(
                'INSERT INTO cart_items (cart_id, product_id, product_name, product_image, quantity, unit_price, currency, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    cartId,
                    item.id,
                    item.name,
                    item.image || '',
                    item.count,
                    item.unitCost,
                    item.currency,
                    (item.count * item.unitCost).toFixed(2)
                ]
            );
        }

        await connection.query(
            'INSERT INTO shipping_info (cart_id, street, number, corner, department, locality, shipping_cost, shipping_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                cartId,
                shippingInfo.street || '',
                shippingInfo.number || '',
                shippingInfo.corner || '',
                shippingInfo.department || '',
                shippingInfo.locality || '',
                shippingInfo.shippingCost || 0,
                shippingInfo.shippingType || 'standard'
            ]
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Carrito guardado',
            data: {
                cartId: cartId,
                total: total.toFixed(2),
                items: items.length
            }
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error al guardar',
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
});

app.listen(PORT, async () => {
    console.log('Servidor en http://localhost:3000');
    console.log('Endpoints disponibles:');
    console.log('   POST /api/login');
    console.log('   POST /api/cart');
    console.log('   GET  /api/cart/:userId');
    console.log('');
    await testConnection();
});

app.get("/api/cart/:userId", authenticateToken, async (req, res) => {
    try {
        const userId = req.params.userId;

        if (req.user.id !== parseInt(userId)) {
            return res.status(403).json({
                success: false,
                message: 'Sin permiso'
            });
        }

        const [carts] = await pool.query(
            'SELECT * FROM carts WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
            [userId]
        );

        if (carts.length === 0) {
            return res.json({ success: true, cart: null });
        }

        const cartId = carts[0].id;

        const [items] = await pool.query(
            'SELECT * FROM cart_items WHERE cart_id = ?',
            [cartId]
        );

        const [shipping] = await pool.query(
            'SELECT * FROM shipping_info WHERE cart_id = ?',
            [cartId]
        );

        res.json({
            success: true,
            cart: {
                id: cartId,
                items: items,
                shipping: shipping[0],
                total: carts[0].total_amount
            }
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get("/json/:folder/:file", authenticateToken, (req, res) => {
    const folder = req.params.folder;
    const file = req.params.file;
    const filePath = path.join(__dirname, "data", folder, file);

    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).json({ error: "Archivo no encontrado" });
        }
    });
});

