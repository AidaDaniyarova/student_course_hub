// middleware/auth.js
import { getSession } from "../tools/auth.js";

export async function attachUser(ctx, next) {
  const session = await getSession(ctx.request);
  if (session) {
    ctx.session = session;
    ctx.user = session.user;
  }
  return await next();
}

export async function requireAuth(ctx, next) {
  const session = await getSession(ctx.request);
  if (!session) {
    return ctx.redirect("/login");
  }
  ctx.session = session;
  ctx.user = session.user;
  return await next();
}

export async function requireAdmin(ctx, next) {
  const session = await getSession(ctx.request);
  
  // Not logged in - redirect to login
  if (!session) {
    return ctx.redirect("/login");
  }
  
  // Logged in but not admin - redirect to home or staff dashboard
  if (session.user.role !== "admin") {
    // If user is staff, redirect to staff dashboard
    if (session.user.role === "staff") {
      return ctx.redirect("/admin/staff-dashboard");
    }
    // Otherwise redirect to home page
    return ctx.redirect("/");
  }
  
  ctx.session = session;
  ctx.user = session.user;
  return await next();
}

export async function requireStaff(ctx, next) {
  const session = await getSession(ctx.request);
  
  // Not logged in - redirect to login
  if (!session) {
    return ctx.redirect("/login");
  }
  
  // Logged in but not staff or admin - redirect to home
  if (!["admin", "staff"].includes(session.user.role)) {
    return ctx.redirect("/");
  }
  
  ctx.session = session;
  ctx.user = session.user;
  return await next();
}