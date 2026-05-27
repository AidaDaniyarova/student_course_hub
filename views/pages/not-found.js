// views/pages/not-found.js
import { mainLayout } from "../layouts/mainLayout.js";

export function notFoundPage(user) {
  const content = `
    <div class="not-found">
      <h1>404</h1>
      <h2>Page Not Found</h2>
      <p>The page you're looking for doesn't exist.</p>
      <a href="/" class="btn btn-primary">Go Home</a>
    </div>
  `;
  
  return mainLayout(content, "Page Not Found", user);
}