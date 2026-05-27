// config/database.js
import { Database } from "jsr:@db/sqlite@0.11";

let db = null;

export function getDb() {
  if (!db) {
    db = new Database("course_hub.db");
    db.exec("PRAGMA foreign_keys = ON");
    db.exec("PRAGMA journal_mode = WAL");
    db.exec("PRAGMA synchronous = NORMAL");
  }
  return db;
}

export async function initDatabase() {
  const database = await getDb();
  
  const tables = database.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name IN ('users', 'programmes', 'modules')
  `).all();
  
  if (tables.length === 0) {
    console.log("⚠️  Database not initialized. Run: deno run --allow-all tasks/init-db.js");
  } else {
    console.log("✅ Database connected");
  }
  
  return database;
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}