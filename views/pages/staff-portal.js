// views/pages/staff-portal.js
import { mainLayout } from "../layouts/mainLayout.js";
import { escapeHtml } from "../../tools/render.js";

export function staffPortalPage(user, modules) {
  const rows = modules.map(m => `
    <tr>
      <td><strong>${escapeHtml(m.code)}</strong></td>
      <td>${escapeHtml(m.title)}</td>
      <td>${m.year || '—'}</td>
      <td>${m.semester || '—'}</td>
      <td>${m.credits || 15}</td>
      <td>${m.programme_count} programme${m.programme_count !== 1 ? 's' : ''}</td>
    </tr>`).join("");
  
  const totalCredits = modules.reduce((sum, m) => sum + (m.credits || 0), 0);
  
  const content = `
    <h1 class="page-title">Staff Portal — ${escapeHtml(user.username)}</h1>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-number">${modules.length}</div>
        <div class="stat-label">Modules Led</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${totalCredits}</div>
        <div class="stat-label">Total Credits</div>
      </div>
    </div>
    
    <h2 style="font-size:1.3rem;margin-bottom:1rem">My Modules</h2>
    
    ${modules.length === 0 
      ? `<div class="alert alert-info">No modules currently assigned to you as module leader.</div>`
      : `
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Title</th>
                <th>Year</th>
                <th>Semester</th>
                <th>Credits</th>
                <th>Programmes</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      `}
  `;
  
  return mainLayout(content, "Staff Portal", user);
}