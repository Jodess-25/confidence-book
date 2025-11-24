// api.js - API GATEWAY CONFIDENCE BOOK v2.0
// FIX: Route vers welcome.html par défaut (PAS app.html)

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { ConfidenceBookService } from './server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ========== MIDDLEWARE ==========
app.use(express.json());
app.use(express.static(__dirname));

app.use((req, res, next) => {
  console.log(`📡 [API GATEWAY] ${req.method} ${req.path}`);
  next();
});

// ========== BACKEND ==========
let backend;

async function initBackend() {
  console.log('🔧 [API GATEWAY] Initializing backend...');
  backend = new ConfidenceBookService();
  await backend.init();
  console.log('✅ [API GATEWAY] Backend ready');
}

// ========== FRONTEND ROUTES (FIX CRITIQUE) ==========

// Route principale → welcome.html (PAS app.html!)
app.get('/', (req, res) => {
  console.log('🌐 [API GATEWAY] Serving welcome.html');
  res.sendFile(path.join(__dirname, 'welcome.html'));
});

// Bloquer explicitement app.html (au cas où)
app.get('/app.html', (req, res) => {
  console.log('⚠️ [API GATEWAY] Redirecting app.html → welcome.html');
  res.redirect('/');
});

// ========== API ENDPOINTS ==========

// Health
app.get('/api/health', async (req, res) => {
  try {
    const result = await backend.healthCheck();
    res.json(result);
  } catch (error) {
    console.error('❌ [API GATEWAY] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Auth
app.post('/api/auth/anonymous', async (req, res) => {
  try {
    console.log('📡 [API GATEWAY] POST /api/auth/anonymous');
    const result = await backend.createAnonymousUser();
    console.log(`✅ [API GATEWAY] User created: ${result.userId}`);
    res.json(result);
  } catch (error) {
    console.error('❌ [API GATEWAY] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/auth/verify', async (req, res) => {
  try {
    console.log('📡 [API GATEWAY] POST /api/auth/verify');
    const result = await backend.verifyUserID(req.body.userId);
    res.json(result);
  } catch (error) {
    console.error('❌ [API GATEWAY] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Confidences
app.get('/api/confidences', async (req, res) => {
  try {
    const result = await backend.getConfidences(req.query);
    console.log(`✅ [API GATEWAY] Returned ${result.data?.length || 0} confidences`);
    res.json(result);
  } catch (error) {
    console.error('❌ [API GATEWAY] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/confidences/:id', async (req, res) => {
  try {
    const result = await backend.getConfidence(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('❌ [API GATEWAY] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/confidences', async (req, res) => {
  try {
    console.log(`📝 [API GATEWAY] Creating confidence`);
    const result = await backend.createConfidence(req.body, req.headers);
    res.json(result);
  } catch (error) {
    console.error('❌ [API GATEWAY] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/confidences/:id', async (req, res) => {
  try {
    console.log(`🗑️ [API GATEWAY] Deleting confidence ${req.params.id}`);
    const result = await backend.deleteConfidence(req.params.id, req.headers);
    res.json(result);
  } catch (error) {
    console.error('❌ [API GATEWAY] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/confidences/:id', async (req, res) => {
  try {
    console.log(`✏️ [API GATEWAY] Updating confidence ${req.params.id}`);
    const result = await backend.updateConfidence(req.params.id, req.body, req.headers);
    res.json(result);
  } catch (error) {
    console.error('❌ [API GATEWAY] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reactions
app.post('/api/reactions', async (req, res) => {
  try {
    console.log(`💙 [API GATEWAY] Adding reaction`);
    const result = await backend.addReaction(req.body, req.headers);
    res.json(result);
  } catch (error) {
    console.error('❌ [API GATEWAY] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Responses
app.post('/api/responses', async (req, res) => {
  try {
    console.log(`💬 [API GATEWAY] Adding response`);
    const result = await backend.addResponse(req.body, req.headers);
    res.json(result);
  } catch (error) {
    console.error('❌ [API GATEWAY] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Profile
app.get('/api/profile', async (req, res) => {
  try {
    const result = await backend.getUserProfile(req.headers);
    res.json(result);
  } catch (error) {
    console.error('❌ [API GATEWAY] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== ERROR HANDLERS ==========
app.use((err, req, res, next) => {
  console.error('💥 [API GATEWAY] Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

app.use((req, res) => {
  console.warn(`⚠️ [API GATEWAY] 404: ${req.method} ${req.path}`);
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ========== START SERVER ==========
async function startServer() {
  await initBackend();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║   🌌 CONFIDENCE BOOK v2.0 - API GATEWAY               ║
║   🌐 Server:     http://0.0.0.0:${PORT.toString().padEnd(27)}║
║   📂 Entry:      welcome.html (NOT app.html!)        ║
║   ⚙️  Backend:    server.js                            ║
║   🔀 Gateway:     api.js (this file)                  ║
║   🛡️  AI Models:  5 fallback (Groq)                   ║
╚═══════════════════════════════════════════════════════╝
    `);
  });
}

startServer();