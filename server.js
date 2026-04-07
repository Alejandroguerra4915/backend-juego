const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;

// "Base de datos" temporal en memoria
let eventsDB = [];

const SECRET = process.env.JWT_SECRET || "test_secret";

app.get("/", (req, res) => {
    res.send("Backend funcionando");
});

// ==========================
// VALIDACIÓN DE TOKEN
// ==========================
app.post("/auth/validate-token", (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ valid: false });
    }

    try {
        const decoded = jwt.verify(token, SECRET);

        res.json({
            valid: true,
            student_id: decoded.sub,
            metadata: decoded.metadata
        });

    } catch (err) {
        res.status(401).json({ valid: false });
    }
});

// ==========================
// EVENTOS GENERALES
// ==========================
app.post("/events", (req, res) => {
    eventsDB.push(req.body);
    res.json({ ok: true });
});

// ==========================
// RESULTADO FINAL EXISTENTE
// ==========================
app.post("/finish", (req, res) => {
    const { student_id } = req.body;

    const userEvents = eventsDB.filter(e => e.student_id === student_id);

    let result = {
        areas: ["Tecnología"],
        carreras: ["Ingeniería de Sistemas"],
        totalEventos: userEvents.length
    };

    res.json(result);
});

// ==========================
// NUEVO: GUARDAR RESULTADO DEL JUEGO
// ==========================
app.post("/game/save-result", (req, res) => {
    const { student_id, ganador, mensaje } = req.body;

    if (!student_id || !ganador) {
        return res.status(400).json({ error: "Datos incompletos" });
    }

    const resultado = {
        type: "game_result",
        student_id: student_id,
        ganador: ganador,
        mensaje: mensaje,
        createdAt: new Date()
    };

    eventsDB.push(resultado);

    console.log("Resultado guardado:", resultado);

    res.json({ success: true });
});

// ==========================
app.listen(PORT, () => {
    console.log("Servidor corriendo en puerto " + PORT);
});