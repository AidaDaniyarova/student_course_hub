// controllers/authController.js - Updated with password hashing
import { getDb } from "../config/database.js";
import { createSession, destroySession, getSession } from "../tools/auth.js";
import { loginPage } from "../views/pages/auth/login.js";
import { User } from "../models/User.js";

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
  
  // Use the updated authenticate method
  const user = await User.authenticate(username, password);
  
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

// Add password change functionality
export async function showChangePassword(ctx) {
  const session = await getSession(ctx.request);
  if (!session) return ctx.redirect("/login");
  
  return ctx.html(changePasswordPage(session.user));
}

export async function handleChangePassword(ctx) {
  const session = await getSession(ctx.request);
  if (!session) return ctx.json({ error: "Unauthorized" }, 401);
  
  const body = await ctx.request.json();
  const currentPassword = body.currentPassword;
  const newPassword = body.newPassword;
  const confirmPassword = body.confirmPassword;
  
  // Validate input
  if (!currentPassword || !newPassword || !confirmPassword) {
    return ctx.json({ error: "All fields are required" }, 400);
  }
  
  if (newPassword !== confirmPassword) {
    return ctx.json({ error: "New passwords do not match" }, 400);
  }
  
  if (newPassword.length < 8) {
    return ctx.json({ error: "Password must be at least 8 characters" }, 400);
  }
  
  // Verify current password
  const user = await User.authenticate(session.user.username, currentPassword);
  if (!user) {
    return ctx.json({ error: "Current password is incorrect" }, 401);
  }
  
  // Update password
  try {
    await User.updatePassword(session.user.id, newPassword);
    return ctx.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    return ctx.json({ error: error.message }, 500);
  }
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