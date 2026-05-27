// views/pages/admin/dashboard.js
import { mainLayout } from "../../layouts/mainLayout.js";
import { escapeHtml, formatDate } from "../../../tools/render.js";

export function adminDashboardPage(user, stats, recent) {
  const content = `
    <h1 class="page-title">Admin Dashboard</h1>
    
    <div class="stats-grid">
      <div class="stat-feature-card">
        <div class="stat-number">${stats.total_programmes}</div>
        <div class="stat-label">Total Programmes</div>
      </div>
      <div class="stat-feature-card">
        <div class="stat-number">${stats.published_programmes}</div>
        <div class="stat-label">Published</div>
      </div>
      <div class="stat-feature-card">
        <div class="stat-number">${stats.total_modules}</div>
        <div class="stat-label">Modules</div>
      </div>
      <div class="stat-feature-card">
        <div class="stat-number">${stats.total_interests}</div>
        <div class="stat-label">Interests</div>
      </div>
      <div class="stat-feature-card">
        <div class="stat-number">${stats.unique_students}</div>
        <div class="stat-label">Unique Students</div>
      </div>
      <div class="stat-feature-card">
        <div class="stat-number">${stats.staff_count}</div>
        <div class="stat-label">Staff Members</div>
      </div>
    </div>
    
    <div class="admin-actions" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-bottom:2rem">
      <a href="/admin/programmes" class="feature-card" style="padding:1.5rem;text-align:center;text-decoration:none;color:inherit">
        <div style="font-size:2.5rem;margin-bottom:0.5rem">📚</div>
        <strong>Manage Programmes</strong>
      </a>
      <a href="/admin/modules" class="feature-card" style="padding:1.5rem;text-align:center;text-decoration:none;color:inherit">
        <div style="font-size:2.5rem;margin-bottom:0.5rem">📋</div>
        <strong>Manage Modules</strong>
      </a>
      <a href="/admin/interests" class="feature-card" style="padding:1.5rem;text-align:center;text-decoration:none;color:inherit">
        <div style="font-size:2.5rem;margin-bottom:0.5rem">📧</div>
        <strong>Mailing List</strong>
      </a>
      <a href="/admin/staff" class="feature-card" style="padding:1.5rem;text-align:center;text-decoration:none;color:inherit">
        <div style="font-size:2.5rem;margin-bottom:0.5rem">👥</div>
        <strong>Staff Management</strong>
      </a>
    </div>
    
    ${recent.length > 0 ? `
      <h2 style="font-size:1.3rem;margin-bottom:1rem">Recent Interest Registrations</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Programme</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${recent.map(r => `
              <tr>
                <td>${escapeHtml(r.name)}</td>
                <td><a href="mailto:${escapeHtml(r.email)}">${escapeHtml(r.email)}</a></td>
                <td>${escapeHtml(r.programme)}</td>
                <td>${formatDate(r.created_at)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    ` : ''}
  `;
  
  return mainLayout(content, "Admin Dashboard", user);
}