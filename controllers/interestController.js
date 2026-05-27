// controllers/interestController.js
import { getDb } from "../config/database.js";
import { Interest } from "../models/Interest.js";
import { adminInterestsPage } from "../views/pages/admin/interests.js";
import { sanitize } from "../tools/render.js";

export async function registerInterest(ctx) {
  const body = await ctx.request.json();
  const name = sanitize(body.name);
  const email = sanitize(body.email);
  const phone = sanitize(body.phone || "");
  const message = sanitize(body.message || "");
  const programmeId = parseInt(body.programme_id);
  
  // Validation
  if (!name || name.length < 2) {
    return ctx.json({ error: "Name is required (min 2 characters)" }, 400);
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return ctx.json({ error: "Valid email is required" }, 400);
  }
  if (!programmeId) {
    return ctx.json({ error: "Programme is required" }, 400);
  }
  
  const db = getDb();
  const prog = db.prepare("SELECT id FROM programmes WHERE id = ? AND published = 1").get(programmeId);
  if (!prog) {
    return ctx.json({ error: "Programme not found" }, 404);
  }
  
  db.prepare(`
    INSERT INTO student_interests (name, email, phone, programme_id, message, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `).run(name, email, phone || null, programmeId, message || null);
  
  return ctx.json({ message: "Thank you! We'll send updates about this programme to your email." });
}

export async function withdrawInterest(ctx) {
  const contentType = ctx.request.headers.get("content-type") || "";
  let interestId, email;
  
  if (contentType.includes("application/json")) {
    const body = await ctx.request.json();
    interestId = body.interest_id;
    email = body.email;
  } else {
    const formData = await ctx.request.formData();
    interestId = formData.get("interest_id");
    email = formData.get("email");
    const redirectUrl = formData.get("redirect") || "/my-interests";
    
    if (interestId && email) {
      const db = getDb();
      db.prepare("DELETE FROM student_interests WHERE id = ? AND email = ?").run(interestId, email);
    }
    return ctx.redirect(redirectUrl);
  }
  
  if (!interestId || !email) {
    return ctx.json({ error: "Missing required fields" }, 400);
  }
  
  const db = getDb();
  db.prepare("DELETE FROM student_interests WHERE id = ? AND email = ?").run(interestId, email);
  return ctx.json({ success: true });
}

// Admin Controllers
export async function adminListInterests(ctx) {
  const programmeId = ctx.query.programme_id || "";
  const db = getDb();
  
  let sql = `
    SELECT si.*, p.title as programme_title 
    FROM student_interests si 
    JOIN programmes p ON si.programme_id = p.id
  `;
  const params = [];
  
  if (programmeId) {
    sql += " WHERE si.programme_id = ?";
    params.push(parseInt(programmeId));
  }
  sql += " ORDER BY si.created_at DESC";
  
  const interests = db.prepare(sql).all(...params);
  const programmes = db.prepare("SELECT id, title FROM programmes ORDER BY title").all();
  
  return ctx.html(adminInterestsPage(ctx.user, interests, programmes, programmeId));
}

export async function adminUpdateStatus(ctx) {
  const id = parseInt(ctx.params.id);
  const formData = await ctx.request.formData();
  const status = formData.get("status") || "pending";
  
  if (["pending", "contacted", "converted"].includes(status)) {
    const db = getDb();
    db.prepare("UPDATE student_interests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(status, id);
  }
  
  const referer = ctx.request.headers.get("referer") || "/admin/interests";
  return ctx.redirect(referer);
}

export async function adminDeleteInterest(ctx) {
  const id = parseInt(ctx.params.id);
  const db = getDb();
  db.prepare("DELETE FROM student_interests WHERE id = ?").run(id);
  
  const referer = ctx.request.headers.get("referer") || "/admin/interests";
  return ctx.redirect(referer);
}

export async function adminExportInterests(ctx) {
  const programmeId = ctx.query.programme_id || "";
  const db = getDb();
  
  let sql = `
    SELECT si.name, si.email, si.phone, p.title as programme_title, 
           p.level, si.status, si.created_at, si.message
    FROM student_interests si
    JOIN programmes p ON si.programme_id = p.id
  `;
  const params = [];
  
  if (programmeId) {
    sql += " WHERE si.programme_id = ?";
    params.push(parseInt(programmeId));
  }
  sql += " ORDER BY p.title, si.created_at";
  
  const rows = db.prepare(sql).all(...params);
  
  const header = "Name,Email,Phone,Programme,Level,Status,Registered,Message\n";
  const csvRows = rows.map(r => [
    r.name, r.email, r.phone || "", r.programme_title, r.level, 
    r.status, r.created_at, r.message || ""
  ].map(cell => `"${String(cell || "").replace(/"/g, '""')}"`).join(",")).join("\n");
  
  const filename = programmeId ? `interests-programme-${programmeId}.csv` : "interests-all.csv";
  
  return new Response(header + csvRows, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}