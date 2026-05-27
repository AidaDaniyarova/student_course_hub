// server.js - Complete server with routing
import { Router } from "./tools/router.js";
import { getDb } from "./config/database.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { logger } from "./middleware/logging.js";
import { attachUser } from "./middleware/auth.js";
import { rateLimit } from "./middleware/security.js";

// Import controllers
import * as authController from "./controllers/authController.js";
import * as programmeController from "./controllers/programmeController.js";
import * as moduleController from "./controllers/moduleController.js";
import * as interestController from "./controllers/interestController.js";
import * as staffController from "./controllers/staffController.js";
import * as viewController from "./controllers/viewController.js";

// Import middleware
import { requireAuth, requireAdmin, requireStaff } from "./middleware/auth.js";

// Initialize database
await getDb();

// Create router instance
export const app = new Router();

// ============ Global Middleware (order matters!) ============
app.use(logger);           // Log requests first
app.use(errorHandler);     // Catch errors
app.use(attachUser);       // Attach user to context
app.use(rateLimit(60));    // Rate limiting

// ============ Static Files ============
app.get("/css/:file", async (ctx) => {
  const file = ctx.params.file;
  try {
    const content = await Deno.readFile(`./public/css/${file}`);
    return new Response(content, {
      headers: { "Content-Type": "text/css" }
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
});

app.get("/js/:file", async (ctx) => {
  const file = ctx.params.file;
  try {
    const content = await Deno.readFile(`./public/js/${file}`);
    return new Response(content, {
      headers: { "Content-Type": "application/javascript" }
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
});

// ============ Public Routes ============
app.get("/", (ctx) => viewController.homePage(ctx));
app.get("/programmes", (ctx) => programmeController.listProgrammes(ctx));
app.get("/programmes/:id", (ctx) => programmeController.showProgramme(ctx));
app.get("/my-interests", (ctx) => viewController.showMyInterests(ctx));

// ============ Auth Routes ============
app.get("/login", (ctx) => authController.showLogin(ctx));
app.post("/login", (ctx) => authController.handleLogin(ctx));
app.get("/logout", (ctx) => authController.handleLogout(ctx));

// ============ API Routes ============
app.post("/api/register-interest", (ctx) => interestController.registerInterest(ctx));
app.post("/api/withdraw-interest", (ctx) => interestController.withdrawInterest(ctx));
app.get("/api/session", (ctx) => authController.getSessionUser(ctx));
app.get("/api/programmes", (ctx) => programmeController.apiGetProgrammes(ctx));

// ============ Staff Portal (requires staff or admin) ============
app.get("/admin/staff-dashboard", requireStaff, (ctx) => viewController.showStaffPortal(ctx));
app.get("/admin/staff-portal", requireStaff, (ctx) => viewController.showStaffLegacyPortal(ctx)); // Redirect for backwards compatibility

// ============ Admin Routes (requires admin) ============
// Dashboard
app.get("/admin/dashboard", requireAdmin, (ctx) => viewController.showDashboard(ctx));
app.get("/admin", requireAdmin, (ctx) => viewController.redirectToDashboard(ctx));

// Programme Management
app.get("/admin/programmes", requireAdmin, (ctx) => programmeController.adminListProgrammes(ctx));
app.get("/admin/programmes/new", requireAdmin, (ctx) => programmeController.adminShowCreateForm(ctx));
app.post("/admin/programmes/new", requireAdmin, (ctx) => programmeController.adminCreateProgramme(ctx));
app.get("/admin/programmes/:id/edit", requireAdmin, (ctx) => programmeController.adminShowEditForm(ctx));
app.post("/admin/programmes/:id/edit", requireAdmin, (ctx) => programmeController.adminUpdateProgramme(ctx));
app.post("/admin/programmes/:id/delete", requireAdmin, (ctx) => programmeController.adminDeleteProgramme(ctx));
app.post("/admin/programmes/:id/toggle", requireAdmin, (ctx) => programmeController.adminTogglePublish(ctx));
app.get("/admin/programmes/:id/modules", requireAdmin, (ctx) => programmeController.adminManageModules(ctx));
app.post("/admin/programmes/:id/modules/add", requireAdmin, (ctx) => programmeController.adminAddModule(ctx));
app.post("/admin/programmes/:id/modules/remove", requireAdmin, (ctx) => programmeController.adminRemoveModule(ctx));

// Module Management
app.get("/admin/modules", requireAdmin, (ctx) => moduleController.adminListModules(ctx));
app.get("/admin/modules/new", requireAdmin, (ctx) => moduleController.adminShowCreateForm(ctx));
app.post("/admin/modules/new", requireAdmin, (ctx) => moduleController.adminCreateModule(ctx));
app.get("/admin/modules/:id/edit", requireAdmin, (ctx) => moduleController.adminShowEditForm(ctx));
app.post("/admin/modules/:id/edit", requireAdmin, (ctx) => moduleController.adminUpdateModule(ctx));
app.post("/admin/modules/:id/delete", requireAdmin, (ctx) => moduleController.adminDeleteModule(ctx));

// Interest Management
app.get("/admin/interests", requireAdmin, (ctx) => interestController.adminListInterests(ctx));
app.get("/admin/interests/export", requireAdmin, (ctx) => interestController.adminExportInterests(ctx));
app.post("/admin/interests/:id/status", requireAdmin, (ctx) => interestController.adminUpdateStatus(ctx));
app.post("/admin/interests/:id/delete", requireAdmin, (ctx) => interestController.adminDeleteInterest(ctx));

// Staff Management
app.get("/admin/staff", requireAdmin, (ctx) => staffController.adminListStaff(ctx));
app.get("/admin/staff/new", requireAdmin, (ctx) => staffController.adminShowCreateForm(ctx));
app.post("/admin/staff/new", requireAdmin, (ctx) => staffController.adminCreateStaff(ctx));
app.post("/admin/staff/:id/delete", requireAdmin, (ctx) => staffController.adminDeleteStaff(ctx));

// ============ 404 Not Found ============
app.notFound((ctx) => viewController.notFoundPage(ctx));