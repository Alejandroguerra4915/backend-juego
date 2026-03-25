const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;

let eventsDB = [];

const SECRET = process.env.JWT_SECRET || "test_secret";

app.get("/", (req, res) => {
    res.send("Backend funcionando");
});

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

app.post("/events", (req, res) => {
    eventsDB.push(req.body);
    res.json({ ok: true });
});

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

app.listen(PORT, () => {
    console.log("Servidor corriendo en puerto " + PORT);
});