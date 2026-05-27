// controllers/programmeController.js
import { getDb } from "../config/database.js";
import { programmeListPage } from "../views/pages/programmes/list.js";
import { programmeDetailPage } from "../views/pages/programmes/detail.js";
import { programmeFormPage, programmeModulesPage } from "../views/pages/programmes/forms.js";
import { adminProgrammeListPage } from "../views/pages/admin/programmes.js";
import { slugify, sanitize } from "../tools/render.js";

export async function listProgrammes(ctx) {
  const filters = {
    published: 1,
    level: ctx.query.level || "",
    search: ctx.query.search || ""
  };
  
  const db = getDb();
  let sql = "SELECT * FROM programmes WHERE published = 1";
  const params = [];
  
  if (filters.level) {
    sql += " AND level = ?";
    params.push(filters.level);
  }
  if (filters.search) {
    sql += " AND (title LIKE ? OR description LIKE ?)";
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }
  sql += " ORDER BY level, title";
  
  const programmes = db.prepare(sql).all(...params);
  return ctx.html(programmeListPage(programmes, filters, ctx.user));
}

export async function showProgramme(ctx) {
  const id = parseInt(ctx.params.id);
  const db = getDb();
  
  const programme = db.prepare("SELECT * FROM programmes WHERE id = ? AND published = 1").get(id);
  if (!programme) {
    return ctx.redirect("/programmes");
  }
  
  // Updated query to include email for better name formatting
  const modules = db.prepare(`
    SELECT m.*, pm.is_mandatory,
      (SELECT COUNT(*) FROM programme_modules WHERE module_id = m.id) as shared_count,
      u.username as leader_username,
      u.email as leader_email
    FROM modules m
    LEFT JOIN programme_modules pm ON m.id = pm.module_id
    LEFT JOIN users u ON m.module_leader_id = u.id
    WHERE pm.programme_id = ?
    ORDER BY m.year, m.semester, m.code
  `).all(id);
  
  const byYear = {};
  for (const m of modules) {
    const year = m.year || 1;
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(m);
  }
  
  const email = ctx.query.email || "";
  const existingInterests = email ? db.prepare(`
    SELECT * FROM student_interests WHERE email = ? AND programme_id = ?
  `).all(email, id) : [];
  const isInterested = existingInterests.length > 0;
  
  return ctx.html(programmeDetailPage(programme, byYear, ctx.user, isInterested));
}

export async function apiGetProgrammes(ctx) {
  const filters = {
    published: ctx.query.published === "0" ? 0 : 1,
    level: ctx.query.level || "",
    search: ctx.query.search || ""
  };
  
  const db = getDb();
  let sql = "SELECT * FROM programmes WHERE 1=1";
  const params = [];
  
  if (filters.published !== undefined) {
    sql += " AND published = ?";
    params.push(filters.published);
  }
  if (filters.level) {
    sql += " AND level = ?";
    params.push(filters.level);
  }
  if (filters.search) {
    sql += " AND (title LIKE ? OR description LIKE ?)";
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }
  sql += " ORDER BY level, title";
  
  const programmes = db.prepare(sql).all(...params);
  return ctx.json({ programmes });
}

// Admin Controllers
export async function adminListProgrammes(ctx) {
  const db = getDb();
  const programmes = db.prepare(`
    SELECT p.*, 
      (SELECT COUNT(*) FROM programme_modules WHERE programme_id = p.id) as module_count,
      (SELECT COUNT(*) FROM student_interests WHERE programme_id = p.id) as interest_count
    FROM programmes p
    ORDER BY p.level, p.title
  `).all();
  
  return ctx.html(adminProgrammeListPage(programmes, ctx.user));
}

export async function adminShowCreateForm(ctx) {
  return ctx.html(programmeFormPage(ctx.user));
}

export async function adminCreateProgramme(ctx) {
  const formData = await ctx.request.formData();
  const title = sanitize(formData.get("title") || "");
  const description = sanitize(formData.get("description") || "");
  const level = formData.get("level") || "";
  
  if (!title || title.length < 3) {
    return ctx.html(programmeFormPage(ctx.user, null, null, null, "Title must be at least 3 characters"));
  }
  
  const slug = slugify(title) + "-" + Date.now();
  const db = getDb();
  
  db.prepare(`
    INSERT INTO programmes (title, slug, description, level, duration, credits, image_url, published, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    title, slug, description, level,
    sanitize(formData.get("duration") || ""),
    parseInt(formData.get("credits") || 360),
    sanitize(formData.get("image_url") || ""),
    formData.get("published") === "1" ? 1 : 0,
    ctx.user.id
  );
  
  return ctx.redirect("/admin/programmes");
}

export async function adminShowEditForm(ctx) {
  const id = parseInt(ctx.params.id);
  const db = getDb();
  const programme = db.prepare("SELECT * FROM programmes WHERE id = ?").get(id);
  
  if (!programme) return ctx.redirect("/admin/programmes");
  return ctx.html(programmeFormPage(ctx.user, programme));
}

export async function adminUpdateProgramme(ctx) {
  const id = parseInt(ctx.params.id);
  const formData = await ctx.request.formData();
  const db = getDb();
  
  db.prepare(`
    UPDATE programmes 
    SET title = ?, description = ?, level = ?, duration = ?,
        credits = ?, image_url = ?, published = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    sanitize(formData.get("title") || ""),
    sanitize(formData.get("description") || ""),
    formData.get("level") || "",
    sanitize(formData.get("duration") || ""),
    parseInt(formData.get("credits") || 360),
    sanitize(formData.get("image_url") || ""),
    formData.get("published") === "1" ? 1 : 0,
    id
  );
  
  return ctx.redirect("/admin/programmes");
}

export async function adminDeleteProgramme(ctx) {
  const id = parseInt(ctx.params.id);
  const db = getDb();
  db.prepare("DELETE FROM programme_modules WHERE programme_id = ?").run(id);
  db.prepare("DELETE FROM student_interests WHERE programme_id = ?").run(id);
  db.prepare("DELETE FROM programmes WHERE id = ?").run(id);
  return ctx.redirect("/admin/programmes");
}

export async function adminTogglePublish(ctx) {
  const id = parseInt(ctx.params.id);
  const db = getDb();
  db.prepare("UPDATE programmes SET published = CASE WHEN published = 1 THEN 0 ELSE 1 END WHERE id = ?").run(id);
  return ctx.redirect("/admin/programmes");
}

export async function adminManageModules(ctx) {
  const id = parseInt(ctx.params.id);
  const db = getDb();
  const programme = db.prepare("SELECT * FROM programmes WHERE id = ?").get(id);
  if (!programme) return ctx.redirect("/admin/programmes");
  
  const assigned = db.prepare(`
    SELECT m.* FROM modules m
    JOIN programme_modules pm ON m.id = pm.module_id
    WHERE pm.programme_id = ?
  `).all(id);
  
  const available = db.prepare(`
    SELECT * FROM modules 
    WHERE id NOT IN (SELECT module_id FROM programme_modules WHERE programme_id = ?)
    ORDER BY year, code
  `).all(id);
  
  return ctx.html(programmeModulesPage(ctx.user, programme, assigned, available));
}

export async function adminAddModule(ctx) {
  const id = parseInt(ctx.params.id);
  const formData = await ctx.request.formData();
  const moduleId = parseInt(formData.get("module_id") || 0);
  const isMandatory = formData.get("is_mandatory") === "1" ? 1 : 0;
  
  if (moduleId) {
    const db = getDb();
    try {
      db.prepare("INSERT INTO programme_modules (programme_id, module_id, is_mandatory) VALUES (?, ?, ?)")
        .run(id, moduleId, isMandatory);
    } catch (e) {
      // Module already exists
    }
  }
  
  return ctx.redirect(`/admin/programmes/${id}/modules`);
}

export async function adminRemoveModule(ctx) {
  const id = parseInt(ctx.params.id);
  const formData = await ctx.request.formData();
  const moduleId = parseInt(formData.get("module_id") || 0);
  
  const db = getDb();
  db.prepare("DELETE FROM programme_modules WHERE programme_id = ? AND module_id = ?").run(id, moduleId);
  
  return ctx.redirect(`/admin/programmes/${id}/modules`);
}