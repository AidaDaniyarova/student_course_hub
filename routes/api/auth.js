// Authentication API routes
import { validateLogin } from "../../tools/validators.js";
import { createSession, destroySession } from "../../middleware/auth.js";
import { db } from "../../server.js";

export async function handleLogin(request) {
  if (request.method === "GET") {
    return new Response(JSON.stringify({ message: "Login endpoint" }), {
      headers: { "Content-Type": "application/json" }
    });
  }
  
  if (request.method === "POST") {
    const body = await request.json();
    const validation = validateLogin(body);
    
    if (!validation.isValid) {
      return new Response(JSON.stringify({ errors: validation.errors }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    const user = db.prepare(`
      SELECT id, username, role, email 
      FROM users 
      WHERE username = ? AND password = ? AND is_active = 1
    `).get(body.username, body.password);
    
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    const response = new Response(JSON.stringify({ 
      success: true, 
      user: { username: user.username, role: user.role }
    }), {
      headers: { "Content-Type": "application/json" }
    });
    
    await createSession(user, response);
    return response;
  }
  
  return new Response("Method not allowed", { status: 405 });
}

export async function handleLogout(request) {
  const response = new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" }
  });
  
  await destroySession(request, response);
  return response;
}

export async function handleSession(request, user) {
  return new Response(JSON.stringify({ authenticated: !!user, user }), {
    headers: { "Content-Type": "application/json" }
  });
}