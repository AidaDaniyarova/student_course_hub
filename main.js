// main.js - Application entry point
import { app } from "./server.js";

// Get port from environment or default to 8000
const port = parseInt(Deno.env.get("PORT") || "8000");

console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                    🎓 Student Course Hub                        ║
╠══════════════════════════════════════════════════════════════════╣
║  Server running at: http://localhost:${port}                        ║
║                                                                    ║
║  Architecture: MVC Pattern with proper separation of concerns     ║
║  - Models: Data layer with SQLite                                ║
║  - Views: Server-side rendered HTML templates                    ║
║  - Controllers: Business logic and request handling              ║
║  - Middleware: Auth, validation, security, rate limiting         ║
║  - Router: Custom router with parameter support                  ║
╠══════════════════════════════════════════════════════════════════╣
║  Demo Accounts:                                                  ║
║    admin     / admin123      (Full Admin Access)                 ║
║    sjohnson  / staff123      (Staff Portal - Module Leader)      ║
║    mchen     / staff123      (Staff Portal)                      ║
║    ebrown    / staff123      (Staff Portal)                      ║
║    student1  / student123    (Student View)                      ║
╠══════════════════════════════════════════════════════════════════╣
║  Routes:                                                         ║
║    GET  /                     - Home page                        ║
║    GET  /programmes           - Browse programmes                ║
║    GET  /programmes/:id       - Programme details                ║
║    GET  /my-interests         - Manage interests                 ║
║    GET  /login                - Login page                       ║
║    POST /login                - Authenticate                     ║
║    GET  /logout               - Logout                           ║
║    GET  /admin/dashboard      - Admin dashboard                  ║
║    GET  /admin/programmes     - Manage programmes                ║
║    GET  /admin/modules        - Manage modules                   ║
║    GET  /admin/interests      - Mailing list                     ║
║    GET  /admin/staff          - Staff management                 ║
║    GET  /admin/staff-portal   - Staff portal                     ║
╚══════════════════════════════════════════════════════════════════╝
`);

// Start the server
Deno.serve({ port }, (request) => {
  return app.handle(request);
});