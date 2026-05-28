// views/pages/auth/change-password.js
import { mainLayout } from "../../layouts/mainLayout.js";
import { escapeHtml } from "../../../tools/render.js";

export function changePasswordPage(user, error = "", success = "") {
  const content = `
    <div class="change-password-container" style="max-width:500px;margin:0 auto;padding:2rem 0">
      <div class="form-card">
        <h1 class="page-title">Change Password</h1>
        <p>Update your password for account: <strong>${escapeHtml(user.username)}</strong></p>
        
        ${error ? `<div class="alert alert-error">${escapeHtml(error)}</div>` : ""}
        ${success ? `<div class="alert alert-success">${escapeHtml(success)}</div>` : ""}
        
        <form id="changePasswordForm">
          <div class="form-group">
            <label for="currentPassword">Current Password</label>
            <input type="password" id="currentPassword" name="currentPassword" required>
          </div>
          
          <div class="form-group">
            <label for="newPassword">New Password</label>
            <input type="password" id="newPassword" name="newPassword" required>
            <small style="color:var(--gray-500);display:block;margin-top:0.25rem">
              Password must be at least 8 characters with uppercase, lowercase, number, and special character
            </small>
          </div>
          
          <div class="form-group">
            <label for="confirmPassword">Confirm New Password</label>
            <input type="password" id="confirmPassword" name="confirmPassword" required>
          </div>
          
          <div style="display:flex;gap:1rem;margin-top:1.5rem">
            <button type="submit" class="btn btn-primary">Update Password</button>
            <a href="/" class="btn btn-outline">Cancel</a>
          </div>
        </form>
        
        <div id="passwordMessage" style="margin-top:1rem"></div>
      </div>
    </div>
    
    <script>
      document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        const response = await fetch('/api/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
        });
        
        const result = await response.json();
        const msgDiv = document.getElementById('passwordMessage');
        
        if (response.ok) {
          msgDiv.innerHTML = '<div class="alert alert-success">' + result.message + '</div>';
          document.getElementById('changePasswordForm').reset();
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
        } else {
          msgDiv.innerHTML = '<div class="alert alert-error">' + (result.error || 'Something went wrong') + '</div>';
        }
      });
    </script>
  `;
  
  return mainLayout(content, "Change Password", user);
}