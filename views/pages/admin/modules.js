// views/pages/admin/modules.js
import { mainLayout } from "../../layouts/mainLayout.js";
import { escapeHtml } from "../../../tools/render.js";

export function adminModuleListPage(modules, user) {
  const rows = modules.map(m => `
    <tr>
      <td><strong>${escapeHtml(m.code)}</strong></td>
      <td>${escapeHtml(m.title)}</td>
      <td>${m.year || '—'}</td>
      <td>${m.semester || '—'}</td>
      <td>${m.credits || 15}</td>
      <td>${escapeHtml(m.leader_name || '—')}</td>
      <td>${m.programme_count || 0}</td>
      <td>
        <div class="action-buttons" style="display:flex;gap:0.5rem">
          <a href="/admin/modules/${m.id}/edit" class="btn btn-outline btn-sm">Edit</a>
          <form method="POST" action="/admin/modules/${m.id}/delete" style="display:inline" onsubmit="return confirm('Delete this module? This will remove it from all programmes.')">
            <button type="submit" class="btn btn-danger btn-sm">Delete</button>
          </form>
        </div>
      </td>
    </tr>`).join("");
  
  const content = `
    <div class="section-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem">
      <div>
        <div class="breadcrumb"><a href="/admin/dashboard">Dashboard</a> › Modules</div>
        <h1 class="page-title">Modules</h1>
      </div>
      <a href="/admin/modules/new" class="btn btn-primary">+ New Module</a>
    </div>
    
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Title</th>
            <th>Year</th>
            <th>Semester</th>
            <th>Credits</th>
            <th>Leader</th>
            <th>Programmes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="8" style="text-align:center;padding:2rem">No modules found.</td></tr>'}
        </tbody>
      </table>
    </div>
  `;
  
  return mainLayout(content, "Manage Modules", user);
}

export function moduleFormPage(user, moduleData = null, staffList = [], error = "") {
  const isEdit = !!moduleData;
  const title = isEdit ? "Edit Module" : "New Module";
  const action = isEdit ? `/admin/modules/${moduleData.id}/edit` : "/admin/modules/new";
  const v = moduleData || {};
  
  const content = `
    <div class="breadcrumb">
      <a href="/admin/dashboard">Dashboard</a> › <a href="/admin/modules">Modules</a> › ${title}
    </div>
    
    <h1 class="page-title">${title}</h1>
    
    ${error ? `<div class="alert alert-error">${escapeHtml(error)}</div>` : ""}
    
    <div class="form-card">
      <form method="POST" action="${action}">
        <div class="form-row">
          <div class="form-group">
            <label for="code">Module Code *</label>
            <input type="text" id="code" name="code" required maxlength="20" value="${escapeHtml(v.code || "")}" placeholder="e.g. CS101">
          </div>
          
          <div class="form-group">
            <label for="title">Module Title *</label>
            <input type="text" id="title" name="title" required maxlength="200" value="${escapeHtml(v.title || "")}">
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="year">Year</label>
            <select id="year" name="year">
              <option value="">—</option>
              ${[1, 2, 3, 4].map(y => `<option value="${y}" ${v.year == y ? 'selected' : ''}>Year ${y}</option>`).join("")}
            </select>
          </div>
          
          <div class="form-group">
            <label for="semester">Semester</label>
            <select id="semester" name="semester">
              <option value="">—</option>
              ${[1, 2].map(s => `<option value="${s}" ${v.semester == s ? 'selected' : ''}>Semester ${s}</option>`).join("")}
            </select>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="credits">Credits</label>
            <input type="number" id="credits" name="credits" min="0" max="60" value="${v.credits || 15}">
          </div>
          
          <div class="form-group">
            <label for="module_leader_id">Module Leader</label>
            <select id="module_leader_id" name="module_leader_id">
              <option value="">— Select Staff Member —</option>
              ${staffList.map(s => `
                <option value="${s.id}" ${v.module_leader_id == s.id ? 'selected' : ''}>
                  ${escapeHtml(s.username)} ${s.email ? `(${escapeHtml(s.email)})` : ''}
                </option>
              `).join("")}
            </select>
          </div>
        </div>
        
        <div class="form-group">
          <label for="description">Description</label>
          <textarea id="description" name="description" rows="5">${escapeHtml(v.description || "")}</textarea>
        </div>
        
        <div class="form-group">
          <label for="image_url">Image URL</label>
          <input type="url" id="image_url" name="image_url" value="${escapeHtml(v.image_url || "")}" placeholder="https://...">
        </div>
        
        <div style="display:flex;gap:1rem;margin-top:1.5rem">
          <button type="submit" class="btn btn-primary">Save Module</button>
          <a href="/admin/modules" class="btn btn-outline">Cancel</a>
        </div>
      </form>
    </div>
  `;
  
  return mainLayout(content, title, user);
}