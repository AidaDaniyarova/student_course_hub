// views/layouts/mainLayout.js
import { escapeHtml } from "../../tools/render.js";

export function mainLayout(content, title = "Student Course Hub", user = null) {
  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "staff";
  
  // Determine which dashboard link to show
  let dashboardLink = '';
  if (isAdmin) {
    dashboardLink = '<a href="/admin/dashboard">Admin Dashboard</a>';
  } else if (isStaff) {
    dashboardLink = '<a href="/admin/staff-dashboard">My Dashboard</a>';
  }
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="description" content="Explore undergraduate and postgraduate programmes at the University">
  <meta name="theme-color" content="#003366">
  <title>${escapeHtml(title)} | Student Course Hub</title>
  <link rel="stylesheet" href="/css/styles.css">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  
  <header class="site-header" role="banner">
    <nav class="navbar" role="navigation" aria-label="Main navigation">
      <div class="container">
        <div class="nav-container">
          <div class="logo">
            <a href="/">🎓 Student Course Hub</a>
          </div>
          
          <input type="checkbox" id="menu-toggle" class="menu-toggle">
          <label for="menu-toggle" class="mobile-menu-btn" aria-label="Menu">
            <span class="menu-icon"></span>
          </label>
          
          <div class="nav-links">
            <a href="/">Home</a>
            <a href="/programmes">Programmes</a>
            
            ${user ? `
              <a href="/my-interests">My Interests</a>
              ${dashboardLink}
              <a href="/logout" class="btn-logout">Logout (${escapeHtml(user.username)})</a>
            ` : `
              <a href="/login" class="btn-login">Staff Login</a>
            `}
          </div>
        </div>
      </div>
    </nav>
  </header>
  
  <main id="main-content" class="main-content" tabindex="-1">
    <div class="container">
      ${content}
    </div>
  </main>
  
  <footer class="site-footer" role="contentinfo">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-section">
          <h3>About Us</h3>
          <p>Providing quality education and research opportunities since 1960.</p>
        </div>
        <div class="footer-section">
          <h3>Quick Links</h3>
          <ul>
            <li><a href="/programmes">Programmes</a></li>
            <li><a href="/privacy">Privacy Policy</a></li>
            <li><a href="/accessibility">Accessibility</a></li>
          </ul>
        </div>
        <div class="footer-section">
          <h3>Contact</h3>
          <p>📧 admissions@university.ac.uk</p>
          <p>📞 +44 (0)123 456789</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2025 University of Example. All rights reserved.</p>
      </div>
    </div>
  </footer>
  
  <script src="/js/app.js" defer></script>
</body>
</html>`;
}