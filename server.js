import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@libsql/client';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(__dirname));

// --- LOGIQUE DE LA BASE DE DONNÉES ---
const db = createClient({
    url: process.env.DATABASE_URL || "file:local.db",
    authToken: process.env.DATABASE_AUTH_TOKEN || ""
});

async function initDB() {
    console.log("⏳ Vérification de la base de données...");
    await db.execute(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            secret_phrase_hash TEXT NOT NULL,
            created_at INTEGER NOT NULL
        )
    `);
    console.log("✅ Base de données prête.");
}

// --- ROUTES ---
app.post('/api/users/create', async (req, res) => {
    try {
        const { secretPhrase } = req.body;
        const userId = `CB_${crypto.randomBytes(4).toString('hex')}`;
        const hash = crypto.createHash('sha256').update(secretPhrase || "key").digest('hex');
        
        await db.execute({
            sql: 'INSERT INTO users (id, secret_phrase_hash, created_at) VALUES (?, ?, ?)',
            args: [userId, hash, Date.now()]
        });

        res.json({ success: true, userId });
    } catch (error) {
        console.error("Erreur creation:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- DÉMARRAGE ---
initDB().then(() => {
    app.listen(port, () => {
        console.log(`🚀 SERVEUR LANCÉ SUR LE PORT ${port}`);
    });
}).catch(err => {
    console.error("❌ ERREUR FATALE :", err);
});
