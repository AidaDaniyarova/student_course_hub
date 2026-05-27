// views/pages/admin/programmes.js
import { mainLayout } from "../../layouts/mainLayout.js";
import { escapeHtml } from "../../../tools/render.js";

export function adminProgrammeListPage(programmes, user) {
  const rows = programmes.map(p => `
    <tr>
      <td><strong>${escapeHtml(p.title)}</strong></td>
      <td><span class="badge ${p.level === 'Undergraduate' ? 'badge-ug' : 'badge-pg'}">${escapeHtml(p.level)}</span></td>
      <td>${p.module_count || 0}</td>
      <td>${p.interest_count || 0}</td>
      <td><span class="badge ${p.published ? 'badge-published' : 'badge-draft'}">${p.published ? 'Published' : 'Draft'}</span></td>
      <td>
        <div class="action-buttons" style="display:flex;gap:0.5rem;flex-wrap:wrap">
          <a href="/admin/programmes/${p.id}/edit" class="btn btn-outline btn-sm">Edit</a>
          <a href="/admin/programmes/${p.id}/modules" class="btn btn-outline btn-sm">Modules</a>
          <a href="/admin/interests?programme_id=${p.id}" class="btn btn-outline btn-sm">Interests</a>
          <form method="POST" action="/admin/programmes/${p.id}/toggle" style="display:inline">
            <button type="submit" class="btn btn-sm ${p.published ? 'btn-danger' : 'btn-success'}">
              ${p.published ? 'Unpublish' : 'Publish'}
            </button>
          </form>
          <form method="POST" action="/admin/programmes/${p.id}/delete" style="display:inline" onsubmit="return confirm('Delete this programme? This will also delete all associated modules and interests.')">
            <button type="submit" class="btn btn-danger btn-sm">Delete</button>
          </form>
        </div>
      </td>
    </tr>`).join("");
  
  const content = `
    <div class="section-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem">
      <div>
        <div class="breadcrumb"><a href="/admin/dashboard">Dashboard</a> › Programmes</div>
        <h1 class="page-title">Programmes</h1>
      </div>
      <a href="/admin/programmes/new" class="btn btn-primary">+ New Programme</a>
    </div>
    
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Level</th>
            <th>Modules</th>
            <th>Interests</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="6" style="text-align:center;padding:2rem">No programmes found.</td></tr>'}
        </tbody>
      </table>
    </div>
  `;
  
  return mainLayout(content, "Manage Programmes", user);
}