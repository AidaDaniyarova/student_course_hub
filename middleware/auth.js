// middleware/auth.js - Authentication middleware
import { db } from "../server.js";

// Session storage (in production, use database)
const sessions = new Map();

export async function getUserFromSession(request) {
  const cookie = await request.headers.get("cookie");
  if (!cookie) return null;
  
  const sessionMatch = cookie.match(/session=([^;]+)/);
  if (!sessionMatch) return null;
  
  const sessionId = sessionMatch[1];
  
  // Check in-memory sessions
  if (sessions.has(sessionId)) {
    const session = sessions.get(sessionId);
    // Check if session expired (24 hours)
    if (Date.now() - session.created > 24 * 60 * 60 * 1000) {
      sessions.delete(sessionId);
      return null;
    }
    return session.user;
  }
  
  // Check database sessions
  const dbSession = db.prepare(`
    SELECT s.*, u.username, u.role, u.email
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ? AND s.expires_at > datetime('now')
  `).get(sessionId);
  
  if (dbSession) {
    const user = {
      id: dbSession.user_id,
      username: dbSession.username,
      role: dbSession.role,
      email: dbSession.email
    };
    sessions.set(sessionId, { user, created: Date.now() });
    return user;
  }
  
  return null;
}

export async function createSession(user, response) {
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);
  
  // Store in database
  db.prepare(`
    INSERT INTO sessions (id, user_id, expires_at)
    VALUES (?, ?, ?)
  `).run(sessionId, await user.id, expiresAt.toISOString());
  
  // Store in memory
  sessions.set(sessionId, { user, created: Date.now() });
  
  // Set cookie
  response.headers.set("Set-Cookie", 
    `session=${sessionId}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax`
  );
  
  return sessionId;
}

export async function destroySession(request, response) {
  const cookie = await request.headers.get("cookie");
  if (cookie) {
    const sessionMatch = cookie.match(/session=([^;]+)/);
    if (sessionMatch) {
      const sessionId = sessionMatch[1];
      sessions.delete(sessionId);
      db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
    }
  }
  
  response.headers.set("Set-Cookie", "session=; HttpOnly; Path=/; Max-Age=0");
}

export function requireAuth(handler) {
  return async (request, user) => {
    if (!(await user)) {
      return new Response("", {
        status: 302,
        headers: { "Location": "/login" }
      });
    }
    return handler(request, user);
  };
}

export function requireAdmin(handler) {
  return async (request, user) => {
    if (!user || user.role !== "admin") {
      return new Response("Unauthorized", {
        status: 403,
        headers: { "Content-Type": "text/plain" }
      });
    }
    return await handler(request, user);
  };
}

export function requireStaff(handler) {
  return async (request, user) => {
    const role = await user.role;
    if (!user || !["admin", "staff"].includes(role)) {
      return new Response("Unauthorized", {
        status: 403,
        headers: { "Content-Type": "text/plain" }
      });
    }
    return handler(request, user);
  };
}