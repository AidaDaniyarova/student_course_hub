// views/pages/programmes/forms.js
import { mainLayout } from "../../layouts/mainLayout.js";
import { escapeHtml } from "../../../tools/render.js";

export function programmeFormPage(user, programme = null, assignedModules = [], availableModules = [], error = "") {
  const isEdit = !!programme;
  const title = isEdit ? "Edit Programme" : "New Programme";
  const action = isEdit ? `/admin/programmes/${programme.id}/edit` : "/admin/programmes/new";
  const v = programme || {};
  
  const content = `
    <div class="breadcrumb">
      <a href="/admin/dashboard">Dashboard</a> › <a href="/admin/programmes">Programmes</a> › ${title}
    </div>
    
    <h1 class="page-title">${title}</h1>
    
    ${error ? `<div class="alert alert-error">${escapeHtml(error)}</div>` : ""}
    
    <div class="form-card">
      <form method="POST" action="${action}">
        <div class="form-group">
          <label for="title">Programme Title *</label>
          <input type="text" id="title" name="title" required maxlength="100" value="${escapeHtml(v.title || "")}">
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="level">Level *</label>
            <select id="level" name="level" required>
              <option value="">Select level...</option>
              <option value="Undergraduate" ${v.level === "Undergraduate" ? "selected" : ""}>Undergraduate</option>
              <option value="Postgraduate" ${v.level === "Postgraduate" ? "selected" : ""}>Postgraduate</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="duration">Duration</label>
            <input type="text" id="duration" name="duration" maxlength="50" value="${escapeHtml(v.duration || "")}" placeholder="e.g. 3 years full-time">
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="credits">Total Credits</label>
            <input type="number" id="credits" name="credits" min="0" max="500" value="${v.credits || 360}">
          </div>
          
          <div class="form-group">
            <label for="image_url">Image URL</label>
            <input type="url" id="image_url" name="image_url" value="${escapeHtml(v.image_url || "")}" placeholder="https://...">
          </div>
        </div>
        
        <div class="form-group">
          <label for="description">Description *</label>
          <textarea id="description" name="description" rows="6" required minlength="20">${escapeHtml(v.description || "")}</textarea>
        </div>
        
        <div class="form-group">
          <label>
            <input type="checkbox" name="published" value="1" ${v.published ? "checked" : ""}>
            Published (visible to students)
          </label>
        </div>
        
        <div style="display:flex;gap:1rem;margin-top:1.5rem">
          <button type="submit" class="btn btn-primary">Save Programme</button>
          <a href="/admin/programmes" class="btn btn-outline">Cancel</a>
        </div>
      </form>
    </div>
  `;
  
  return mainLayout(content, title, user);
}

export function programmeModulesPage(user, programme, assignedModules, availableModules, error = "") {
  const content = `
    <div class="breadcrumb">
      <a href="/admin/dashboard">Dashboard</a> › <a href="/admin/programmes">Programmes</a> › ${escapeHtml(programme.title)} › Modules
    </div>
    
    <h1 class="page-title">Manage Modules: ${escapeHtml(programme.title)}</h1>
    
    ${error ? `<div class="alert alert-error">${escapeHtml(error)}</div>` : ""}
    
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem;margin-top:1.5rem">
      <div>
        <h2 style="font-size:1.2rem;margin-bottom:1rem">Assigned Modules (${assignedModules.length})</h2>
        ${assignedModules.length === 0 ? '<p class="alert alert-info">No modules assigned to this programme.</p>' : ''}
        ${assignedModules.map(m => `
          <div class="module-card" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem">
            <div>
              <span class="module-code">${escapeHtml(m.code)}</span>
              <div><strong>${escapeHtml(m.title)}</strong></div>
              <div style="font-size:0.8rem;color:var(--gray-500)">Year ${m.year || '?'} · ${m.credits || 15} credits</div>
            </div>
            <form method="POST" action="/admin/programmes/${programme.id}/modules/remove" onsubmit="return confirm('Remove this module?')">
              <input type="hidden" name="module_id" value="${m.id}">
              <button type="submit" class="btn btn-danger btn-sm">Remove</button>
            </form>
          </div>
        `).join("")}
      </div>
      
      <div>
        <h2 style="font-size:1.2rem;margin-bottom:1rem">Available Modules</h2>
        <div class="form-card">
          <form method="POST" action="/admin/programmes/${programme.id}/modules/add">
            <div class="form-group">
              <label for="module_id">Select Module</label>
              <select id="module_id" name="module_id" required>
                <option value="">Choose module...</option>
                ${availableModules.map(m => `
                  <option value="${m.id}">${escapeHtml(m.code)}: ${escapeHtml(m.title)} (Year ${m.year || '?'})</option>
                `).join("")}
              </select>
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" name="is_mandatory" value="1" checked>
                Mandatory module
              </label>
            </div>
            <button type="submit" class="btn btn-primary">Add Module</button>
          </form>
        </div>
      </div>
    </div>
    
    <div style="margin-top:2rem">
      <a href="/admin/programmes" class="btn btn-outline">← Back to Programmes</a>
    </div>
  `;
  
  return mainLayout(content, `Manage Modules - ${programme.title}`, user);
}