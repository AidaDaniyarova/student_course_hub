// Main layout template
import { escapeHtml } from "../../tools/render.js";

export function mainLayout(content, title = "Student Course Hub", user = null, breadcrumbs = []) {
  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "staff" || isAdmin;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="description" content="Explore our range of undergraduate and postgraduate programmes at the University">
  <title>${escapeHtml(title)} | Student Course Hub</title>
  <link rel="stylesheet" href="/css/styles.css">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  
  <header class="site-header">
    <nav class="navbar" aria-label="Main navigation">
      <div class="nav-container">
        <div class="logo">
          <a href="/">Student Course Hub</a>
        </div>
        
        <button class="mobile-menu-btn" aria-label="Menu" aria-expanded="false">
          ☰
        </button>
        
        <div class="nav-links">
          <a href="/">Home</a>
          <a href="/programmes">Programmes</a>
          <a href="/programmes?level=Undergraduate">Undergraduate</a>
          <a href="/programmes?level=Postgraduate">Postgraduate</a>
          
          ${user ? `
            <a href="/my-interests">My Interests</a>
            ${isStaff ? `<a href="/admin">Dashboard</a>` : ""}
            <a href="/logout" class="btn-logout">Logout (${escapeHtml(user.username)})</a>
          ` : `
            <a href="/login" class="btn-login">Staff Login</a>
          `}
        </div>
      </div>
    </nav>
    
    ${breadcrumbs.length > 0 ? `
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        <div class="container">
          <ul>
            ${breadcrumbs.map(cr => `
              <li><a href="${escapeHtml(cr.url)}">${escapeHtml(cr.name)}</a></li>
            `).join("")}
          </ul>
        </div>
      </nav>
    ` : ""}
  </header>
  
  <main id="main-content" class="main-content">
    <div class="container">
      ${content}
    </div>
  </main>
  
  <footer class="site-footer">
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
          <p>Email: admissions@university.ac.uk</p>
          <p>Phone: +44 (0)123 456789</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2025 University of Example. All rights reserved.</p>
      </div>
    </div>
  </footer>
  
  <script src="/js/app.js"></script>
</body>
</html>`;
}