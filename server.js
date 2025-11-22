// server.js - BACKEND SERVICE CONFIDENCE BOOK
// Logique métier + Modération IA + Database

import { createClient } from '@libsql/client';

export class ConfidenceBookService {
  constructor() {
    this.db = null;
    this.aiEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
    this.aiApiKey = process.env.GROQ_API_KEY;
    
    // Fallback models (basé sur résultats Colab - Novembre 2024)
    this.groqModels = [
      'llama-3.1-8b-instant',         // ✅ Testé - Rapide
      'llama-3.3-70b-versatile',      // ✅ Testé - Puissant
      'meta-llama/llama-4-scout-17b-16e-instruct',
      'qwen/qwen3-32b',
      'groq/compound'
    ];
  }

  async init() {
    console.log('✅ [BACKEND] Initializing Confidence Book Service...');
    
    this.db = createClient({
      url: process.env.DATABASE_URL || 'file:local.db',
      authToken: process.env.DATABASE_AUTH_TOKEN
    });

    await this.createTables();
    console.log('✅ [BACKEND] Database connected');
  }

  async createTables() {
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        created_at INTEGER NOT NULL
      )
    `);

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS confidences (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        content TEXT NOT NULL,
        emotion TEXT NOT NULL,
        moderation_score REAL,
        moderation_message TEXT,
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS reactions (
        id TEXT PRIMARY KEY,
        confidence_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (confidence_id) REFERENCES confidences(id),
        UNIQUE(confidence_id, user_id, type)
      )
    `);

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS responses (
        id TEXT PRIMARY KEY,
        confidence_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        content TEXT NOT NULL,
        avatar TEXT NOT NULL,
        moderation_score REAL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (confidence_id) REFERENCES confidences(id)
      )
    `);

    console.log('✅ [BACKEND] Tables created/verified');
  }

  async createAnonymousUser() {
    const userId = 'user_' + Math.random().toString(36).substr(2, 9);
    const now = Date.now();
    
    await this.db.execute({
      sql: 'INSERT INTO users (id, created_at) VALUES (?, ?)',
      args: [userId, now]
    });
    
    console.log('[BACKEND] Created anonymous user:', userId);
    return { success: true, userId };
  }

  async getConfidences(query) {
    const chapter = query.chapter || 'all';
    const now = Date.now();
    
    let sql = `
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM reactions WHERE confidence_id = c.id AND type = 'soutien') as reactions_soutien,
        (SELECT COUNT(*) FROM reactions WHERE confidence_id = c.id AND type = 'espoir') as reactions_espoir,
        (SELECT COUNT(*) FROM reactions WHERE confidence_id = c.id AND type = 'compatis') as reactions_compatis,
        (SELECT COUNT(*) FROM reactions WHERE confidence_id = c.id AND type = 'pas_seul') as reactions_pas_seul,
        (SELECT COUNT(*) FROM reactions WHERE confidence_id = c.id AND type = 'courage') as reactions_courage,
        (SELECT COUNT(*) FROM reactions WHERE confidence_id = c.id AND type = 'triste') as reactions_triste
      FROM confidences c
      WHERE c.expires_at > ?
    `;
    
    const args = [now];
    
    if (chapter !== 'all') {
      sql += ' AND c.emotion = ?';
      args.push(chapter);
    }
    
    sql += ' ORDER BY c.created_at DESC LIMIT 50';
    
    const result = await this.db.execute({ sql, args });
    
    const confidences = await Promise.all(result.rows.map(async (row) => {
      const responsesResult = await this.db.execute({
        sql: 'SELECT * FROM responses WHERE confidence_id = ? ORDER BY created_at ASC',
        args: [row.id]
      });
      
      return {
        id: row.id,
        user_id: row.user_id,
        content: row.content,
        emotion: row.emotion,
        created_at: row.created_at,
        reactions: {
          soutien: Number(row.reactions_soutien),
          espoir: Number(row.reactions_espoir),
          compatis: Number(row.reactions_compatis),
          pas_seul: Number(row.reactions_pas_seul),
          courage: Number(row.reactions_courage),
          triste: Number(row.reactions_triste)
        },
        responses: responsesResult.rows.map(r => ({
          id: r.id,
          content: r.content,
          avatar: r.avatar,
          created_at: r.created_at
        }))
      };
    }));
    
    console.log(`[BACKEND] Retrieved ${confidences.length} confidences`);
    return { success: true, data: confidences };
  }

  async createConfidence(body, headers) {
    const userId = headers['x-user-id'];
    const { content, emotion } = body;
    
    if (!userId || !content || !emotion) {
      return { success: false, message: 'Données manquantes' };
    }
    
    if (content.trim().length < 10) {
      return { success: false, message: 'Confidence trop courte (min 10 caractères)' };
    }
    
    console.log('[BACKEND] Moderating confidence with AI...');
    const moderationResult = await this.moderateContent(content, 'confidence');
    
    if (!moderationResult.approved) {
      return {
        success: false,
        moderated: true,
        published: false,
        moderationMessage: moderationResult.message
      };
    }
    
    const confidenceId = 'conf_' + Math.random().toString(36).substr(2, 9);
    const now = Date.now();
    const expiresAt = now + (90 * 24 * 60 * 60 * 1000);
    
    await this.db.execute({
      sql: `INSERT INTO confidences 
            (id, user_id, content, emotion, moderation_score, moderation_message, created_at, expires_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [confidenceId, userId, content, emotion, moderationResult.score, moderationResult.message, now, expiresAt]
    });
    
    console.log('[BACKEND] Confidence created:', confidenceId);
    
    return {
      success: true,
      moderated: moderationResult.warning,
      published: true,
      moderationMessage: moderationResult.message,
      confidenceId
    };
  }

  async deleteConfidence(confidenceId, headers) {
    const userId = headers['x-user-id'];
    
    const confidence = await this.db.execute({
      sql: 'SELECT user_id FROM confidences WHERE id = ?',
      args: [confidenceId]
    });
    
    if (confidence.rows.length === 0 || confidence.rows[0].user_id !== userId) {
      return { success: false, message: 'Non autorisé' };
    }
    
    await this.db.execute({ sql: 'DELETE FROM reactions WHERE confidence_id = ?', args: [confidenceId] });
    await this.db.execute({ sql: 'DELETE FROM responses WHERE confidence_id = ?', args: [confidenceId] });
    await this.db.execute({ sql: 'DELETE FROM confidences WHERE id = ?', args: [confidenceId] });
    
    console.log('[BACKEND] Confidence deleted:', confidenceId);
    return { success: true };
  }

  async addReaction(body, headers) {
    const userId = headers['x-user-id'];
    const { confidenceId, reactionType } = body;
    
    if (!userId || !confidenceId || !reactionType) {
      return { success: false, message: 'Données manquantes' };
    }
    
    try {
      const existing = await this.db.execute({
        sql: 'SELECT * FROM reactions WHERE confidence_id = ? AND user_id = ? AND type = ?',
        args: [confidenceId, userId, reactionType]
      });
      
      if (existing.rows.length > 0) {
        await this.db.execute({
          sql: 'DELETE FROM reactions WHERE confidence_id = ? AND user_id = ? AND type = ?',
          args: [confidenceId, userId, reactionType]
        });
        console.log('[BACKEND] Reaction removed (toggle):', reactionType);
        return { success: true, action: 'removed' };
      }
      
      await this.db.execute({
        sql: 'DELETE FROM reactions WHERE confidence_id = ? AND user_id = ?',
        args: [confidenceId, userId]
      });
      
      const reactionId = 'react_' + Math.random().toString(36).substr(2, 9);
      const now = Date.now();
      
      await this.db.execute({
        sql: 'INSERT INTO reactions (id, confidence_id, user_id, type, created_at) VALUES (?, ?, ?, ?, ?)',
        args: [reactionId, confidenceId, userId, reactionType, now]
      });
      
      console.log('[BACKEND] Reaction added:', reactionType);
      return { success: true, action: 'added' };
      
    } catch (error) {
      console.error('[BACKEND] Reaction error:', error);
      return { success: false, message: 'Erreur database' };
    }
  }

  async addResponse(body, headers) {
    const userId = headers['x-user-id'];
    const { confidenceId, content } = body;
    
    if (!userId || !confidenceId || !content) {
      return { success: false, message: 'Données manquantes' };
    }
    
    if (content.trim().length < 5) {
      return { success: false, message: 'Réponse trop courte (min 5 caractères)' };
    }
    
    console.log('[BACKEND] Moderating response with AI...');
    const moderationResult = await this.moderateContent(content, 'response');
    
    if (!moderationResult.approved) {
      return { success: false, message: moderationResult.message };
    }
    
    const avatars = ['🌙', '☀️', '🌿', '🧘', '🌸', '🦋', '🌊', '🍃', '⭐', '💫'];
    const avatar = avatars[Math.floor(Math.random() * avatars.length)];
    
    const responseId = 'resp_' + Math.random().toString(36).substr(2, 9);
    const now = Date.now();
    
    await this.db.execute({
      sql: `INSERT INTO responses 
            (id, confidence_id, user_id, content, avatar, moderation_score, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [responseId, confidenceId, userId, content, avatar, moderationResult.score, now]
    });
    
    console.log('[BACKEND] Response created:', responseId);
    return { success: true, responseId };
  }

  async moderateContent(content, type) {
    if (!this.aiApiKey) {
      console.log('[BACKEND] No AI key, skipping moderation (dev mode)');
      return { approved: true, score: 0.9, warning: false, message: 'Moderation skipped (dev mode)' };
    }
    
    const prompt = type === 'confidence' 
      ? this.getModerationPromptConfidence(content)
      : this.getModerationPromptResponse(content);
    
    for (let i = 0; i < this.groqModels.length; i++) {
      const model = this.groqModels[i];
      
      try {
        console.log(`[BACKEND] Calling Groq API (model: ${model})...`);
        
        const response = await fetch(this.aiEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.aiApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: 'Tu es un modérateur bienveillant pour Confidence Book. Réponds UNIQUEMENT par APPROVED ou REJECTED: raison.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.2,
            max_tokens: 200,
            stream: false
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[BACKEND] Model ${model} failed:`, response.status, errorText);
          
          if (i === this.groqModels.length - 1) {
            return { approved: true, score: 0.7, warning: false, message: 'Moderation service unavailable' };
          }
          continue;
        }
        
        const data = await response.json();
        const aiResponse = data.choices[0].message.content.trim();
        
        console.log(`[BACKEND] AI Response (${model}):`, aiResponse);
        
        if (aiResponse.startsWith('APPROVED')) {
          const warningMatch = aiResponse.match(/WARNING: (.+)/);
          return {
            approved: true,
            score: 0.8,
            warning: !!warningMatch,
            message: warningMatch ? warningMatch[1] : 'Contenu validé'
          };
        } else if (aiResponse.startsWith('REJECTED')) {
          const reason = aiResponse.replace('REJECTED:', '').trim();
          return {
            approved: false,
            score: 0.2,
            warning: false,
            message: reason || 'Contenu non conforme aux règles'
          };
        }
        
        return { approved: true, score: 0.7, warning: false, message: 'Moderation completed' };
        
      } catch (error) {
        console.error(`[BACKEND] Model ${model} error:`, error.message);
        
        if (i === this.groqModels.length - 1) {
          return { approved: true, score: 0.7, warning: false, message: 'Moderation error, approved by default' };
        }
        continue;
      }
    }
    
    return { approved: true, score: 0.7, warning: false, message: 'Fallback approval' };
  }

  getModerationPromptConfidence(content) {
    return `Analyse cette confidence pour Confidence Book:

RÈGLES:
✅ ACCEPTER: Expressions de tristesse, peur, colère, espoir, trauma personnel, pensées suicidaires (appel à l'aide légitime)
❌ REJETER: Noms/prénoms/lieux/numéros de téléphone, publicité, spam, violence envers autrui, haine, discrimination, hors sujet (sport/politique)

CONFIDENCE:
"${content}"

Réponds UNIQUEMENT par:
- "APPROVED" si respecte les règles
- "APPROVED WARNING: [message]" si sensible (ex: pensées suicidaires)
- "REJECTED: [raison]" si viole les règles

Réponse:`;
  }

  getModerationPromptResponse(content) {
    return `Analyse cette réponse à une confidence:

RÈGLES:
✅ ACCEPTER: Empathie, soutien, conseils constructifs
❌ REJETER: Jugement, critique dure, conseils dangereux, spam

RÉPONSE:
"${content}"

Réponds: "APPROVED" ou "REJECTED: [raison]"

Réponse:`;
  }

  async healthCheck() {
    const checks = {
      timestamp: new Date().toISOString(),
      status: 'ok',
      services: {}
    };
    
    try {
      await this.db.execute('SELECT 1');
      checks.services.database = 'connected';
    } catch (error) {
      checks.services.database = 'offline';
      checks.status = 'degraded';
    }
    
    checks.services.ai = this.aiApiKey ? 'configured' : 'dev-mode';
    return checks;
  }
}