// controllers/staffController.js
import { getDb } from "../config/database.js";
import { adminStaffListPage, addStaffFormPage } from "../views/pages/admin/staff.js";
import { sanitize } from "../tools/render.js";

export async function adminListStaff(ctx) {
  const db = getDb();
  const staff = db.prepare(`
    SELECT u.*,
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
  
  if (!username || !password) {
    return ctx.html(addStaffFormPage(ctx.user, "Username and password are required"));
  }
  
  const db = getDb();
  try {
    db.prepare("INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)")
      .run(username, password, email || null, role);
  } catch (e) {
    return ctx.html(addStaffFormPage(ctx.user, "Could not add staff: username may already exist"));
  }
  
  return ctx.redirect("/admin/staff");
}

export async function adminDeleteStaff(ctx) {
  const id = parseInt(ctx.params.id);
  const db = getDb();
  
  // Unassign modules first
  db.prepare("UPDATE modules SET module_leader_id = NULL WHERE module_leader_id = ?").run(id);
  db.prepare("DELETE FROM staff_programmes WHERE staff_id = ?").run(id);
  db.prepare("DELETE FROM users WHERE id = ? AND role = 'staff'").run(id);
  
  return ctx.redirect("/admin/staff");
}