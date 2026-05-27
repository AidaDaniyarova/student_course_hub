// controllers/moduleController.js
import { getDb } from "../config/database.js";
import { Module } from "../models/Module.js";
import { adminModuleListPage, moduleFormPage } from "../views/pages/admin/modules.js";
import { sanitize } from "../tools/render.js";

export async function adminListModules(ctx) {
  const db = getDb();
  const modules = db.prepare(`
    SELECT m.*, u.username as leader_name,
      (SELECT COUNT(*) FROM programme_modules WHERE module_id = m.id) as programme_count
    FROM modules m
    LEFT JOIN users u ON m.module_leader_id = u.id
    ORDER BY m.year, m.semester, m.code
  `).all();
  
  return ctx.html(adminModuleListPage(modules, ctx.user));
}

export async function adminShowCreateForm(ctx) {
  const db = getDb();
  const staff = db.prepare("SELECT id, username, email FROM users WHERE role IN ('admin', 'staff') ORDER BY username").all();
  return ctx.html(moduleFormPage(ctx.user, null, staff));
}

export async function adminCreateModule(ctx) {
  const formData = await ctx.request.formData();
  const code = sanitize(formData.get("code") || "").toUpperCase();
  const title = sanitize(formData.get("title") || "");
  
  if (!code || code.length < 3) {
    const db = getDb();
    const staff = db.prepare("SELECT id, username, email FROM users WHERE role IN ('admin', 'staff')").all();
    return ctx.html(moduleFormPage(ctx.user, null, staff, "Module code must be at least 3 characters"));
  }
  
  if (!title || title.length < 3) {
    const db = getDb();
    const staff = db.prepare("SELECT id, username, email FROM users WHERE role IN ('admin', 'staff')").all();
    return ctx.html(moduleFormPage(ctx.user, null, staff, "Title must be at least 3 characters"));
  }
  
  const db = getDb();
  const moduleLeaderId = parseInt(formData.get("module_leader_id") || 0) || null;
  
  try {
    db.prepare(`
      INSERT INTO modules (code, title, description, year, semester, credits, module_leader_id, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      code, title,
      sanitize(formData.get("description") || ""),
      parseInt(formData.get("year") || 0) || null,
      parseInt(formData.get("semester") || 0) || null,
      parseInt(formData.get("credits") || 15) || 15,
      moduleLeaderId,
      sanitize(formData.get("image_url") || "")
    );
  } catch (e) {
    const staff = db.prepare("SELECT id, username, email FROM users WHERE role IN ('admin', 'staff')").all();
    return ctx.html(moduleFormPage(ctx.user, null, staff, `Could not create module: ${e.message}`));
  }
  
  return ctx.redirect("/admin/modules");
}

export async function adminShowEditForm(ctx) {
  const id = parseInt(ctx.params.id);
  const db = getDb();
  const moduleData = db.prepare("SELECT * FROM modules WHERE id = ?").get(id);
  
  if (!moduleData) return ctx.redirect("/admin/modules");
  
  const staff = db.prepare("SELECT id, username, email FROM users WHERE role IN ('admin', 'staff') ORDER BY username").all();
  return ctx.html(moduleFormPage(ctx.user, moduleData, staff));
}

export async function adminUpdateModule(ctx) {
  const id = parseInt(ctx.params.id);
  const formData = await ctx.request.formData();
  const code = sanitize(formData.get("code") || "").toUpperCase();
  const title = sanitize(formData.get("title") || "");
  
  if (!code || !title) {
    const db = getDb();
    const staff = db.prepare("SELECT id, username, email FROM users WHERE role IN ('admin', 'staff')").all();
    const moduleData = db.prepare("SELECT * FROM modules WHERE id = ?").get(id);
    return ctx.html(moduleFormPage(ctx.user, moduleData, staff, "Code and title are required"));
  }
  
  const db = getDb();
  const moduleLeaderId = parseInt(formData.get("module_leader_id") || 0) || null;
  
  try {
    db.prepare(`
      UPDATE modules 
      SET code = ?, title = ?, description = ?, year = ?, semester = ?,
          credits = ?, module_leader_id = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      code, title,
      sanitize(formData.get("description") || ""),
      parseInt(formData.get("year") || 0) || null,
      parseInt(formData.get("semester") || 0) || null,
      parseInt(formData.get("credits") || 15) || 15,
      moduleLeaderId,
      sanitize(formData.get("image_url") || ""),
      id
    );
  } catch (e) {
    const staff = db.prepare("SELECT id, username, email FROM users WHERE role IN ('admin', 'staff')").all();
    const moduleData = db.prepare("SELECT * FROM modules WHERE id = ?").get(id);
    return ctx.html(moduleFormPage(ctx.user, moduleData, staff, `Update failed: ${e.message}`));
  }
  
  return ctx.redirect("/admin/modules");
}

export async function adminDeleteModule(ctx) {
  const id = parseInt(ctx.params.id);
  const db = getDb();
  db.prepare("DELETE FROM programme_modules WHERE module_id = ?").run(id);
  db.prepare("DELETE FROM modules WHERE id = ?").run(id);
  return ctx.redirect("/admin/modules");
}