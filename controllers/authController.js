// controllers/authController.js
import { getDb } from "../config/database.js";
import { createSession, destroySession, getSession } from "../tools/auth.js";
import { loginPage } from "../views/pages/auth/login.js";

export async function showLogin(ctx) {
  const session = await getSession(ctx.request);
  if (session) {
    return ctx.redirect(session.user.role === "admin" ? "/admin/dashboard" : "/");
  }
  return ctx.html(loginPage());
}

export async function handleLogin(ctx) {
  const formData = await ctx.request.formData();
  const username = formData.get("username") || "";
  const password = formData.get("password") || "";
  
  const db = getDb();
  const user = db.prepare(`
    SELECT id, username, role, email 
    FROM users 
    WHERE username = ? AND password = ? AND is_active = 1
  `).get(username, password);
  
  if (!user) {
    return ctx.html(loginPage("Invalid username or password"));
  }
  
  let redirectPath = "/";
  if (user.role === "admin") {
    redirectPath = "/admin/dashboard";
  } else if (user.role === "staff") {
    redirectPath = "/admin/staff-dashboard";
  }
  
  const response = ctx.redirect(redirectPath);
  await createSession(user, response);
  return response;
}

export async function handleLogout(ctx) {
  const response = ctx.redirect("/");
  await destroySession(ctx.request, response);
  return response;
}

export async function getSessionUser(ctx) {
  const session = await getSession(ctx.request);
  return ctx.json({ authenticated: !!session, user: session?.user || null });
}