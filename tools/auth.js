// tools/auth.js - Authentication utilities
import { getDb } from "../config/database.js";

const sessions = new Map();

export async function getSession(request) {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/session=([^;]+)/);
  if (!match) return null;
  
  const sessionId = match[1];
  
  // Check memory cache
  if (sessions.has(sessionId)) {
    const session = sessions.get(sessionId);
    if (Date.now() - session.createdAt < 24 * 60 * 60 * 1000) {
      return session;
    }
    sessions.delete(sessionId);
  }
  
  // Check database
  const db = getDb();
  const dbSession = db.prepare(`
    SELECT s.*, u.id as user_id, u.username, u.role, u.email
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ? AND s.expires_at > datetime('now')
  `).get(sessionId);
  
  if (dbSession) {
    const session = {
      id: sessionId,
      user: {
        id: dbSession.user_id,
        username: dbSession.username,
        role: dbSession.role,
        email: dbSession.email
      },
      createdAt: Date.now()
    };
    sessions.set(sessionId, session);
    return session;
  }
  
  return null;
}

export async function createSession(user, response) {
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);
  
  const db = getDb();
  db.prepare(`
    INSERT INTO sessions (id, user_id, expires_at)
    VALUES (?, ?, ?)
  `).run(sessionId, await user.id, expiresAt.toISOString());
  
  const session = { id: sessionId, user, createdAt: Date.now() };
  sessions.set(sessionId, session);
  
  response.headers.set("Set-Cookie", 
    `session=${sessionId}; HttpOnly; Path=/; Max-Age=86400; SameSite=Strict`
  );
  
  return session;
}

export async function destroySession(request, response) {
  const cookie = await request.headers.get("cookie") || "";
  const match = cookie.match(/session=([^;]+)/);
  
  if (match) {
    const sessionId = match[1];
    sessions.delete(sessionId);
    
    const db = getDb();
    db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
  }
  
  response.headers.set("Set-Cookie", "session=; HttpOnly; Path=/; Max-Age=0");
}