// controllers/viewController.js
import { getDb } from "../config/database.js";
import { homePage as homeView } from "../views/pages/home.js";
import { notFoundPage as notFoundView } from "../views/pages/not-found.js";
import { myInterestsPage } from "../views/pages/my-interests.js";
import { staffPortalPage } from "../views/pages/staff-portal.js";
import { staffDashboardPage } from "../views/pages/staff-dashboard.js";
import { adminDashboardPage } from "../views/pages/admin/dashboard.js";
import { getSession } from "../tools/auth.js";

export async function homePage(ctx) {
  const session = await getSession(ctx.request);
  return ctx.html(homeView(session?.user));
}

export async function notFoundPage(ctx) {
  const session = await getSession(ctx.request);
  return ctx.html(notFoundView(session?.user), 404);
}

export async function showMyInterests(ctx) {
  const session = await getSession(ctx.request);
  const email = ctx.query.email || "";
  
  let interests = [];
  if (email) {
    const db = getDb();
    interests = db.prepare(`
      SELECT si.*, p.title as programme_title, p.level as programme_level
      FROM student_interests si
      JOIN programmes p ON si.programme_id = p.id
      WHERE si.email = ?
      ORDER BY si.created_at DESC
    `).all(email);
  }
  
  return ctx.html(myInterestsPage(interests, email, session?.user));
}

export async function showStaffPortal(ctx) {
  const session = await getSession(ctx.request);
  if (!session) return ctx.redirect("/login");
  
  const db = getDb();
  
  // Get modules where this staff is the module leader
  const modules = db.prepare(`
    SELECT m.*, 
      COUNT(DISTINCT pm.programme_id) as programme_count,
      GROUP_CONCAT(DISTINCT p.title) as programme_names
    FROM modules m
    LEFT JOIN programme_modules pm ON m.id = pm.module_id
    LEFT JOIN programmes p ON pm.programme_id = p.id
    WHERE m.module_leader_id = ?
    GROUP BY m.id
    ORDER BY m.year, m.semester, m.code
  `).all(session.user.id);
  
  // Get statistics for staff
  const stats = {
    total_modules: modules.length,
    total_credits: modules.reduce((sum, m) => sum + (m.credits || 0), 0),
    total_programmes: new Set(modules.map(m => m.programme_names?.split(',') || []).flat()).size
  };
  
  return ctx.html(staffDashboardPage(session.user, modules, stats));
}

// Legacy staff portal route (redirect to new dashboard)
export async function showStaffLegacyPortal(ctx) {
  return ctx.redirect("/admin/staff-dashboard");
}

export async function showDashboard(ctx) {
  const session = await getSession(ctx.request);
  if (!session) return ctx.redirect("/login");
  
  // Redirect staff to their dashboard, admin to admin dashboard
  if (session.user.role === "staff") {
    return ctx.redirect("/admin/staff-dashboard");
  }
  
  if (session.user.role !== "admin") {
    return ctx.redirect("/");
  }
  
  const db = getDb();
  
  const stats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM programmes) as total_programmes,
      (SELECT COUNT(*) FROM programmes WHERE published=1) as published_programmes,
      (SELECT COUNT(*) FROM modules) as total_modules,
      (SELECT COUNT(*) FROM student_interests) as total_interests,
      (SELECT COUNT(DISTINCT email) FROM student_interests) as unique_students,
      (SELECT COUNT(*) FROM users WHERE role IN ('staff','admin')) as staff_count
  `).get();
  
  const recent = db.prepare(`
    SELECT si.name, si.email, p.title as programme, si.created_at
    FROM student_interests si
    JOIN programmes p ON si.programme_id = p.id
    ORDER BY si.created_at DESC
    LIMIT 5
  `).all();
  
  return ctx.html(adminDashboardPage(session.user, stats, recent));
}

export async function redirectToDashboard(ctx) {
  const session = await getSession(ctx.request);
  if (!session) return ctx.redirect("/login");
  
  // Staff goes to staff dashboard, admin goes to admin dashboard
  if (session.user.role === "staff") {
    return ctx.redirect("/admin/staff-dashboard");
  } else if (session.user.role === "admin") {
    return ctx.redirect("/admin/dashboard");
  }
  
  // Default fallback
  return ctx.redirect("/");
}