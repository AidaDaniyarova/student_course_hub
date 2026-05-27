// views/pages/auth/login.js
import { mainLayout } from "../../layouts/mainLayout.js";
import { escapeHtml } from "../../../tools/render.js";

export function loginPage(error = "") {
  const content = `
    <div class="login-container" style="max-width:420px;margin:0 auto;padding:2rem 0">
      <div class="form-card">
        <h1 style="font-size:1.75rem;margin-bottom:0.5rem">Staff Login</h1>
        <p style="color:var(--gray-500);margin-bottom:1.5rem">Access the administration dashboard</p>
        
        ${error ? `<div class="alert alert-error">${escapeHtml(error)}</div>` : ""}
        
        <form method="POST" action="/login">
          <div class="form-group">
            <label for="username">Username</label>
            <input id="username" name="username" type="text" required autocomplete="username" autofocus>
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input id="password" name="password" type="password" required autocomplete="current-password">
          </div>
          <button class="btn btn-primary" type="submit" style="width:100%">Login</button>
        </form>
        
        <p style="margin-top:1rem;font-size:0.8rem;color:var(--gray-500);text-align:center">
          Demo: <code>admin / admin123</code> · <code>sjohnson / staff123</code>
        </p>
      </div>
    </div>
  `;
  
  return mainLayout(content, "Staff Login", null);
}