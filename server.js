const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 SERVIR MODELOS 3D (AQUÍ VA)
app.use('/modelos', express.static('modelos'));

// 🔥 TU PUBLIC (ya lo tenías)
app.use(express.static(__dirname));

// ⚠️ IMPORTANTE: Ajusta tu contraseña de MySQL aquí
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345',
    database: 'herbo'
});

db.connect(err => {
    if (err) {
        console.log("❌ Error conexión:", err);
    } else {
        console.log("🔥 Conectado a MySQL");
    }
});

// REGISTRO
app.post('/register', async (req, res) => {
    const { nombre, email, password } = req.body;

    const hash = await bcrypt.hash(password, 10);

    db.query(
        'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)',
        [nombre, email, hash],
        (err) => {
            if (err) return res.send(err);
            res.send("✅ Usuario registrado");
        }
    );
});

// LOGIN
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.query(
        'SELECT * FROM usuarios WHERE email = ?',
        [email],
        async (err, results) => {

            if (results.length === 0) {
                return res.send("❌ Usuario no existe");
            }

            const valid = await bcrypt.compare(password, results[0].password);

            if (!valid) {
                return res.send("❌ Contraseña incorrecta");
            }

            const token = jwt.sign({ id: results[0].id }, "secreto");

            res.json({
                mensaje: "✅ Login exitoso",
                token: token,
                usuario: results[0]
            });
        }
    );
});

// PLANTAS
app.get('/plantas', (req, res) => {
    db.query('SELECT * FROM plantas', (err, results) => {
        res.json(results);
    });
});

// DETALLE COMPLETO DE PLANTA
app.get('/planta/:id', (req, res) => {
    const id = req.params.id;

    db.query(`
        SELECT 
            p.*,
            u.enfermedad,
            u.uso,
            pr.tipo,
            pr.preparacion,
            pr.dosis,
            i.instrucciones,
            i.advertencias
        FROM plantas p
        LEFT JOIN usos_medicinales u ON p.id = u.planta_id
        LEFT JOIN preparaciones pr ON p.id = pr.planta_id
        LEFT JOIN instrucciones_detalladas i ON p.id = i.planta_id
        WHERE p.id = ?
    `, [id], (err, results) => {
        res.json(results);
    });
});

// INICIAR SERVIDOR
app.listen(3000, () => {
    console.log("🚀 Servidor en http://localhost:3000");
});