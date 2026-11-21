// controllers/staffController.js
import { getDb } from "../config/database.js";
import { adminStaffListPage, addStaffFormPage } from "../views/pages/admin/staff.js";
import { sanitize } from "../tools/render.js";
import { User } from "../models/User.js";
import { validateEmail, validateUsername, validatePasswordStrength } from "../tools/validators.js";

export async function adminListStaff(ctx) {
  const db = getDb();
  const staff = db.prepare(`
    SELECT u.id, u.username, u.email, u.role, u.created_at,
      (SELECT COUNT(*) FROM modules WHERE module_leader_id = u.id) as module_count
    FROM users u
    WHERE u.role IN ('admin', 'staff')
    ORDER BY u.role, u.username
  `).all();
  
  return ctx.html(adminStaffListPage(staff, ctx.user));
}

export async function adminShowCreateForm(ctx) {
  return ctx.html(addStaffFormPage(ctx.user));
}

export async function adminCreateStaff(ctx) {
  const formData = await ctx.request.formData();
  const username = sanitize(formData.get("username") || "");
  const email = sanitize(formData.get("email") || "");
  const password = formData.get("password") || "";
  const role = ["staff", "admin"].includes(formData.get("role")) ? formData.get("role") : "staff";
  
  // Validation checks
  const errors = [];
  
  // Username validation
  if (!username) {
    errors.push("Username is required");
  } else if (!validateUsername(username)) {
    errors.push("Username must be 3-50 characters and can only contain letters, numbers, dots, and underscores");
  }
  
  // Password validation
  if (!password) {
    errors.push("Password is required");
  } else if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  } else if (!validatePasswordStrength(password)) {
    errors.push("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character");
  }
  
  // Email validation (optional but must be valid if provided)
  if (email && !validateEmail(email)) {
    errors.push("Please enter a valid email address");
  }
  
  // If there are validation errors, return to form
  if (errors.length > 0) {
    return ctx.html(addStaffFormPage(ctx.user, errors.join(". ")));
  }
  
  const db = getDb();
  try {
    // Check if username exists
    const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
    if (existing) {
      return ctx.html(addStaffFormPage(ctx.user, "Username already exists. Please choose a different username."));
    }
    
    // Check if email exists (if email provided)
    if (email) {
      const existingEmail = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
      if (existingEmail) {
        return ctx.html(addStaffFormPage(ctx.user, "Email already exists. Please use a different email address."));
      }
    }
    
    // Create staff with hashed password
    await User.createStaff(username, password, email || null, role);
  } catch (e) {
    return ctx.html(addStaffFormPage(ctx.user, `Could not add staff: ${e.message}`));
  }
  
  return ctx.redirect("/admin/staff");
}

export async function adminDeleteStaff(ctx) {
  const id = parseInt(ctx.params.id);
  const db = getDb();
  
  // Check if trying to delete own account
  if (id === ctx.user.id) {
    const referer = ctx.request.headers.get("referer") || "/admin/staff";
    return ctx.redirect(referer);
  }
  
  // Unassign modules first
  db.prepare("UPDATE modules SET module_leader_id = NULL WHERE module_leader_id = ?").run(id);
  db.prepare("DELETE FROM staff_programmes WHERE staff_id = ?").run(id);
  db.prepare("DELETE FROM users WHERE id = ? AND role = 'staff'").run(id);
  
  return ctx.redirect("/admin/staff");
}