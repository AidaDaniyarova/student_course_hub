// views/pages/staff-dashboard.js
import { mainLayout } from "../layouts/mainLayout.js";
import { escapeHtml, getFullName } from "../../tools/render.js";

export function staffDashboardPage(user, modules, stats) {
  const displayName = getFullName(user.username, user.email) || user.username;
  const modulesHtml = modules.length === 0 
    ? '<div class="alert alert-info">No modules assigned to you yet.</div>'
    : `
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Module Title</th>
              <th>Year</th>
              <th>Semester</th>
              <th>Credits</th>
              <th>Programmes</th>
            </tr>
          </thead>
          <tbody>
            ${modules.map(m => `
              <tr>
                <td><strong>${escapeHtml(m.code)}</strong></td>
                <td>${escapeHtml(m.title)}</td>
                <td>${m.year || '—'}</td>
                <td>${m.semester || '—'}</td>
                <td>${m.credits || 15}</td>
                <td>${escapeHtml(m.programme_names || '—')}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  
  const content = `
    <div class="staff-dashboard">
      <div class="dashboard-header">
        <h1 class="page-title">Staff Dashboard</h1>
        <p class="welcome-message">Welcome back, ${displayName}!</p>
      </div>
      
      <div class="stats-grid">
        <div class="stat-feature-card">
          <div class="stat-number">${stats.total_modules}</div>
          <div class="stat-label">Modules Led</div>
        </div>
        <div class="stat-feature-card">
          <div class="stat-number">${stats.total_credits}</div>
          <div class="stat-label">Total Credits</div>
        </div>
        <div class="stat-feature-card">
          <div class="stat-number">${stats.total_programmes}</div>
          <div class="stat-label">Programmes</div>
        </div>
      </div>
      
      <div class="dashboard-section">
        <h2>My Modules</h2>
        ${modulesHtml}
      </div>
      
      <div class="dashboard-section">
        <h2>Quick Actions</h2>
        <div class="action-buttons" style="display: flex; gap: 1rem; flex-wrap: wrap;">
          <a href="/programmes" class="btn btn-primary">Browse Programmes</a>
          <a href="/my-interests" class="btn btn-outline">View Student Interests</a>
          ${user.role === 'admin' ? '<a href="/admin/dashboard" class="btn btn-secondary">Go to Admin Dashboard</a>' : ''}
        </div>
      </div>
    </div>
  `;
  
  return mainLayout(content, "Staff Dashboard", user);
}