import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const db = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN
});

async function resetDatabase() {
  console.log('🔄 Starting database reset...');
  
  try {
    // Drop existing tables
    console.log('📦 Dropping existing tables...');
    await db.execute('DROP TABLE IF EXISTS response_reactions');
    await db.execute('DROP TABLE IF EXISTS responses');
    await db.execute('DROP TABLE IF EXISTS reactions');
    await db.execute('DROP TABLE IF EXISTS confidences');
    await db.execute('DROP TABLE IF EXISTS users');
    
    console.log('✅ Tables dropped successfully');
    
    // Create users table
    console.log('📦 Creating users table...');
    await db.execute(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        secret_phrase_hash TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        last_active INTEGER,
        premium INTEGER DEFAULT 0,
        premium_type TEXT,
        premium_start INTEGER,
        premium_end INTEGER,
        premium_payment_id TEXT,
        settings TEXT DEFAULT '{"theme":"dark","avatar":"moon","language":"fr"}'
      )
    `);
    
    // Create confidences table
    console.log('📦 Creating confidences table...');
    await db.execute(`
      CREATE TABLE confidences (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        content TEXT NOT NULL,
        emotion TEXT NOT NULL,
        moderation_score REAL,
        moderation_message TEXT,
        needs_review INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Create reactions table
    console.log('📦 Creating reactions table...');
    await db.execute(`
      CREATE TABLE reactions (
        id TEXT PRIMARY KEY,
        confidence_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        UNIQUE(confidence_id, user_id),
        FOREIGN KEY (confidence_id) REFERENCES confidences(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Create responses table
    console.log('📦 Creating responses table...');
    await db.execute(`
      CREATE TABLE responses (
        id TEXT PRIMARY KEY,
        confidence_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        content TEXT NOT NULL,
        avatar TEXT NOT NULL,
        moderation_score REAL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (confidence_id) REFERENCES confidences(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Create response_reactions table
    console.log('📦 Creating response_reactions table...');
    await db.execute(`
      CREATE TABLE response_reactions (
        id TEXT PRIMARY KEY,
        response_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        UNIQUE(response_id, user_id),
        FOREIGN KEY (response_id) REFERENCES responses(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    console.log('✅ All tables created successfully');
    console.log('🎉 Database reset complete!');
    
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    throw error;
  }
}

resetDatabase();