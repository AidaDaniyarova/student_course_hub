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
      ${s.role !== 'admin' 
        ? `<td>
            <form method="POST" action="/admin/staff/${s.id}/delete" onsubmit="return confirm('Remove this staff member? They will be unassigned from all modules.')">
              <button type="submit" class="btn btn-danger btn-sm">Remove</button>
            </form>
           </td>`
        : '<td>—</td>'}
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
      <form method="POST" action="/admin/staff/new">
        <div class="form-group">
          <label for="username">Username *</label>
          <input type="text" id="username" name="username" required>
        </div>
        
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" name="email">
        </div>
        
        <div class="form-group">
          <label for="password">Password *</label>
          <input type="password" id="password" name="password" required>
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
  `;
  
  return mainLayout(content, "Add Staff", user);
}