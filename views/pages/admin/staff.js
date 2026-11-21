// views/pages/admin/staff.js
import { mainLayout } from "../../layouts/mainLayout.js";
import { escapeHtml, formatDate } from "../../../tools/render.js";

export function adminStaffListPage(staff, user) {
  const rows = staff.map(s => `
    <tr>
      <td><strong>${escapeHtml(s.username)}</strong></td>
      <td>${escapeHtml(s.email || '—')}</td>
      <td><span class="badge ${s.role === 'admin' ? 'badge-pg' : 'badge-ug'}">${escapeHtml(s.role)}</span></td>
      <td>${s.module_count || 0}</td>
      <td>${formatDate(s.created_at)}</td>
      ${s.role !== 'admin' && s.id !== user.id ? `
        <td>
          <form method="POST" action="/admin/staff/${s.id}/delete" onsubmit="return confirm('Remove this staff member? They will be unassigned from all modules.')">
            <button type="submit" class="btn btn-danger btn-sm">Remove</button>
          </form>
        </td>
      ` : '<td>—</td>'}
    </tr>`).join("");
  
  const content = `
    <div class="section-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem">
      <div>
        <div class="breadcrumb"><a href="/admin/dashboard">Dashboard</a> › Staff</div>
        <h1 class="page-title">Staff Members</h1>
      </div>
      <a href="/admin/staff/new" class="btn btn-primary">+ Add Staff</a>
    </div>
    
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Modules Led</th>
            <th>Joined</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="6" style="text-align:center;padding:2rem">No staff members found.</td></tr>'}
        </tbody>
      </table>
    </div>
  `;
  
  return mainLayout(content, "Staff Management", user);
}

export function addStaffFormPage(user, error = "") {
  const content = `
    <div class="breadcrumb">
      <a href="/admin/dashboard">Dashboard</a> › <a href="/admin/staff">Staff</a> › Add Staff
    </div>
    
    <h1 class="page-title">Add Staff Member</h1>
    
    ${error ? `<div class="alert alert-error">${escapeHtml(error)}</div>` : ""}
    
    <div class="form-card" style="max-width:500px">
      <form method="POST" action="/admin/staff/new" id="addStaffForm">
        <div class="form-group">
          <label for="username">Username *</label>
          <input type="text" id="username" name="username" required 
                 pattern="[a-zA-Z0-9._]{3,50}"
                 placeholder="e.g., john.doe, jane_smith, jdoe"
                 title="3-50 characters: letters, numbers, dots, underscores">
          <small style="color:var(--gray-500);display:block;margin-top:0.25rem">
            3-50 characters: letters, numbers, dots, underscores
          </small>
        </div>
        
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" 
                 pattern="[^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$]+"
                 placeholder="e.g., staff@university.com"
                 title="Please enter a valid email address">
          <small style="color:var(--gray-500);display:block;margin-top:0.25rem">
            Optional but must be valid if provided
          </small>
        </div>
        
        <div class="form-group">
          <label for="password">Password *</label>
          <input type="password" id="password" name="password" required>
          <small style="color:var(--gray-500);display:block;margin-top:0.25rem">
            Must be at least 8 characters with uppercase, lowercase, number, and special character
          </small>
          <div id="passwordStrength" style="margin-top:0.5rem"></div>
        </div>
        
        <div class="form-group">
          <label for="role">Role</label>
          <select id="role" name="role">
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        
        <div style="display:flex;gap:1rem;margin-top:1.5rem">
          <button type="submit" class="btn btn-primary">Add Staff Member</button>
          <a href="/admin/staff" class="btn btn-outline">Cancel</a>
        </div>
      </form>
    </div>
    
    <script>
      // Real-time password strength indicator
      const passwordInput = document.getElementById('password');
      const strengthDiv = document.getElementById('passwordStrength');
      
      function checkPasswordStrength(password) {
        let strength = 0;
        let messages = [];
        
        if (password.length >= 8) strength++;
        else messages.push('❌ At least 8 characters');
        
        if (/[A-Z]/.test(password)) strength++;
        else messages.push('❌ Uppercase letter');
        
        if (/[a-z]/.test(password)) strength++;
        else messages.push('❌ Lowercase letter');
        
        if (/[0-9]/.test(password)) strength++;
        else messages.push('❌ Number');
        
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
        else messages.push('❌ Special character');
        
        let strengthText = '';
        let strengthColor = '';
        
        if (strength === 5) {
          strengthText = '✓ Strong password';
          strengthColor = 'green';
        } else if (strength >= 3) {
          strengthText = '⚠️ Medium password - ' + messages.join(', ');
          strengthColor = 'orange';
        } else {
          strengthText = '❌ Weak password - ' + messages.join(', ');
          strengthColor = 'red';
        }
        
        strengthDiv.innerHTML = \`<small style="color:\${strengthColor}">\${strengthText}</small>\`;
      }
      
      passwordInput.addEventListener('input', function() {
        checkPasswordStrength(this.value);
      });
      
      // Form validation before submit
      document.getElementById('addStaffForm').addEventListener('submit', function(e) {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const username = document.getElementById('username').value;
        
        // Validate email format if provided
        if (email) {
          const emailRegex = /^[^\\s@]+@([^\\s@]+\\.)+[^\\s@]+$/;
          if (!emailRegex.test(email)) {
            e.preventDefault();
            alert('Please enter a valid email address');
            return false;
          }
        }
        
        // Validate password strength
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /[0-9]/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        if (password.length < 8 || !hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
          e.preventDefault();
          alert('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
          return false;
        }
        
        // Validate username format
        const usernameRegex = /^[a-zA-Z0-9._]{3,50}$/;
        if (!usernameRegex.test(username)) {
          e.preventDefault();
          alert('Username must be 3-50 characters and can only contain letters, numbers, dots, and underscores');
          return false;
        }
      });
    </script>
  `;
  
  return mainLayout(content, "Add Staff", user);
}