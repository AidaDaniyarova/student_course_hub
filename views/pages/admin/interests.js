// views/pages/admin/interests.js
import { mainLayout } from "../../layouts/mainLayout.js";
import { escapeHtml, formatDate } from "../../../tools/render.js";

export function adminInterestsPage(user, interests, programmes, selectedProgramme = "") {
  const rows = interests.map(i => `
    <tr>
      <td>${escapeHtml(i.name)}</td>
      <td><a href="mailto:${escapeHtml(i.email)}">${escapeHtml(i.email)}</a></td>
      <td>${escapeHtml(i.phone || '—')}</td>
      <td>${escapeHtml(i.programme_title)}</td>
      <td>${formatDate(i.created_at)}</td>
      <td>
        <form method="POST" action="/admin/interests/${i.id}/status" style="display:inline">
          <select name="status" class="status-select" onchange="this.form.submit()" style="padding:0.25rem;border-radius:4px">
            <option value="pending" ${i.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="contacted" ${i.status === 'contacted' ? 'selected' : ''}>Contacted</option>
            <option value="converted" ${i.status === 'converted' ? 'selected' : ''}>Converted</option>
          </select>
        </form>
      </td>
      <td>
        <form method="POST" action="/admin/interests/${i.id}/delete" style="display:inline" onsubmit="return confirm('Delete this registration?')">
          <button type="submit" class="btn btn-danger btn-sm">Delete</button>
        </form>
      </td>
    </tr>`).join("");
  
  const exportUrl = selectedProgramme 
    ? `/admin/interests/export?programme_id=${selectedProgramme}`
    : "/admin/interests/export";
  
  const content = `
    <div class="section-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem">
      <div>
        <div class="breadcrumb"><a href="/admin/dashboard">Dashboard</a> › Mailing List</div>
        <h1 class="page-title">Mailing List & Interests</h1>
      </div>
      <a href="${exportUrl}" class="btn btn-primary">⬇ Export CSV</a>
    </div>
    
    <div class="filters">
      <form method="GET" action="/admin/interests" style="display:flex;gap:1rem;align-items:flex-end">
        <div class="form-group" style="flex:1">
          <label for="programme_id">Filter by Programme</label>
          <select id="programme_id" name="programme_id">
            <option value="">All Programmes</option>
            ${programmes.map(p => `
              <option value="${p.id}" ${selectedProgramme == p.id ? 'selected' : ''}>${escapeHtml(p.title)}</option>
            `).join("")}
          </select>
        </div>
        <button type="submit" class="btn btn-primary">Filter</button>
        ${selectedProgramme ? `<a href="/admin/interests" class="btn btn-outline">Clear</a>` : ""}
      </form>
    </div>
    
    <p style="color:var(--gray-500);margin-bottom:1rem">${interests.length} record${interests.length !== 1 ? 's' : ''}</p>
    
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Programme</th>
            <th>Registered</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="7" style="text-align:center;padding:2rem">No registrations found.</td></table>'}
        </tbody>
      </table>
    </div>
  `;
  
  return mainLayout(content, "Mailing List", user);
}