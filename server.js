const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const mongoose = require("mongoose"); // NUEVO

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;

// ==========================
// CONEXIÓN MONGODB (NUEVO)
// ==========================
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Mongo conectado"))
    .catch(err => console.error("Error Mongo:", err));

// ==========================
// MODELOS MONGODB (NUEVO)
// ==========================
const AnswerSchema = new mongoose.Schema({
    student_id: String,
    question_id: String,
    selected_option: String,
    createdAt: { type: Date, default: Date.now }
});

const ResultSchema = new mongoose.Schema({
    student_id: String,
    ganador: String,
    mensaje: String,
    createdAt: { type: Date, default: Date.now }
});

const Answer = mongoose.model("Answer", AnswerSchema);
const Result = mongoose.model("Result", ResultSchema);

// Base de datos temporal en memoria
let eventsDB = [];

// ==========================
// SECRETO JWT
// ==========================
const SECRET = "jYV3XKHpYAg1xcimVHObpI9vPez6FZUuVckK_z1uoGc";

// ==========================
// RUTA RAIZ
// ==========================
app.get("/", (req, res) => {
    res.send("Backend funcionando");
});

// ==========================
// VALIDACIÓN DE TOKEN
// ==========================
app.post("/auth/validate-token", (req, res) => {
    const { token } = req.body;

    if (!token) return res.status(400).json({ valid: false });

    try {
        const decoded = jwt.verify(token, SECRET);

        res.json({
            valid: true,
            student_id: decoded.sub,
            metadata: decoded.metadata || {}
        });

    } catch (err) {
        res.status(401).json({ valid: false });
    }
});

// ==========================
// RUTA EVENTOS GENERALES
// ==========================
app.post("/events", (req, res) => {
    eventsDB.push(req.body);
    res.json({ ok: true });
});

// ==========================
// RUTA RESPUESTAS (NUEVO)
// ==========================
app.post("/game/answer", async (req, res) => {
    try {
        const { student_id, question_id, selected_option } = req.body;

        if (!student_id || !question_id || !selected_option) {
            return res.status(400).json({ error: "Datos incompletos" });
        }

        const answer = new Answer({
            student_id,
            question_id,
            selected_option
        });

        await answer.save();

        res.json({ success: true });

    } catch (err) {
        res.status(500).json({ error: "Error guardando respuesta" });
    }
});

// ==========================
// RUTA RESULTADO FINAL EXISTENTE (NO SE TOCA)
// ==========================
app.post("/finish", (req, res) => {
    const { student_id } = req.body;

    const userEvents = eventsDB.filter(e => e.student_id === student_id);

    const result = {
        areas: ["Tecnología"],
        carreras: ["Ingeniería de Sistemas"],
        totalEventos: userEvents.length
    };

    res.json(result);
});

// ==========================
// RUTA RESULTADO FINAL (MEJORADA)
// ==========================
app.post("/game/save-result", async (req, res) => {
    const { student_id, ganador, mensaje } = req.body;

    if (!student_id || !ganador) {
        return res.status(400).json({ error: "Datos incompletos" });
    }

    // Guardar en MongoDB
    const nuevoResultado = new Result({
        student_id,
        ganador,
        mensaje
    });

    await nuevoResultado.save();

    // Mantener memoria (no se elimina nada)
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