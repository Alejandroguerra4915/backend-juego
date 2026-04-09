const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;

// ==========================
// CONEXIÓN A MONGODB ATLAS
// ==========================
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

let db;

async function connectDB() {
    try {
        await client.connect();
        db = client.db("juego");
        console.log("Conectado a MongoDB Atlas");
    } catch (error) {
        console.error("Error conectando a MongoDB:", error);
    }
}

connectDB();

// ==========================
// BASE TEMPORAL (solo respaldo)
// ==========================
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
// EVENTOS GENERALES
// ==========================
app.post("/events", async (req, res) => {
    try {
        await db.collection("eventos").insertOne(req.body);
        res.json({ ok: true });
    } catch (error) {
        console.error("Error guardando evento:", error);
        res.status(500).json({ error: "Error guardando evento" });
    }
});

// ==========================
// GUARDAR RESPUESTA POR PREGUNTA
// ==========================
app.post("/game/answer", async (req, res) => {
    const { student_id, question_id, selected_option } = req.body;

    if (!student_id || !question_id || !selected_option) {
        return res.status(400).json({ error: "Datos incompletos" });
    }

    const respuesta = {
        type: "game_answer",
        student_id,
        question_id,
        selected_option,
        createdAt: new Date()
    };

    try {
        await db.collection("respuestas").insertOne(respuesta);

        console.log("Respuesta guardada:", respuesta);

        res.json({ success: true });
    } catch (error) {
        console.error("Error guardando respuesta:", error);
        res.status(500).json({ error: "Error guardando respuesta" });
    }
});

// ==========================
// RESULTADO FINAL EXISTENTE
// ==========================
app.post("/finish", async (req, res) => {
    const { student_id } = req.body;

    try {
        const userEvents = await db.collection("respuestas").find({
            student_id: student_id
        }).toArray();

        const result = {
            areas: ["Tecnología"],
            carreras: ["Ingeniería de Sistemas"],
            totalEventos: userEvents.length
        };

        res.json(result);

    } catch (error) {
        console.error("Error en finish:", error);
        res.status(500).json({ error: "Error obteniendo resultados" });
    }
});

// ==========================
// GUARDAR RESULTADO FINAL
// ==========================
app.post("/game/save-result", async (req, res) => {
    const { student_id, ganador, mensaje } = req.body;

    if (!student_id || !ganador) {
        return res.status(400).json({ error: "Datos incompletos" });
    }

    const resultado = {
        type: "game_result",
        student_id,
        ganador,
        mensaje,
        createdAt: new Date()
    };

    try {
        await db.collection("resultados").insertOne(resultado);

        console.log("Resultado guardado:", resultado);

        res.json({ success: true });
    } catch (error) {
        console.error("Error guardando resultado:", error);
        res.status(500).json({ error: "Error guardando resultado" });
    }
});

// ==========================
app.listen(PORT, () => {
    console.log("Servidor corriendo en puerto " + PORT);
});