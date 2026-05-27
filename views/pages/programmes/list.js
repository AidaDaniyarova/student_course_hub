// views/pages/programmes/list.js
import { mainLayout } from "../../layouts/mainLayout.js";
import { escapeHtml, truncate } from "../../../tools/render.js";

export function programmeListPage(programmes, filters, user) {
  const cards = programmes.length === 0
    ? `<p class="no-results" style="text-align:center;padding:3rem;color:var(--gray-500)">No programmes found. Try adjusting your search.</p>`
    : programmes.map(p => `
      <div class="programme-card">
        ${p.image_url 
          ? `<img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.title)}" class="programme-image" loading="lazy">`
          : `<div class="programme-image" style="background:var(--gray-100);display:flex;align-items:center;justify-content:center;font-size:3rem">📚</div>`}
        <div class="programme-content">
          <span class="badge ${p.level === 'Undergraduate' ? 'badge-ug' : 'badge-pg'}">${escapeHtml(p.level)}</span>
          <h3>${escapeHtml(p.title)}</h3>
          <p>${escapeHtml(truncate(p.description, 120))}</p>
          <div class="programme-meta">
            <span>⏱ ${escapeHtml(p.duration || '3 years')}</span>
            <span>📊 ${p.credits || 360} credits</span>
          </div>
          <a href="/programmes/${p.id}" class="btn btn-outline">View Details →</a>
        </div>
      </div>
    `).join("");
  
  const level = filters.level || "";
  const search = filters.search || "";
  
  const content = `
    <h1 class="page-title">Programmes</h1>
    
    <div class="filters">
      <div class="filter-controls">
        <button class="filter-btn ${!level ? 'active' : ''}" data-level="all">All</button>
        <button class="filter-btn ${level === 'Undergraduate' ? 'active' : ''}" data-level="Undergraduate">Undergraduate</button>
        <button class="filter-btn ${level === 'Postgraduate' ? 'active' : ''}" data-level="Postgraduate">Postgraduate</button>
      </div>
      
      <div class="search-box">
        <input type="search" id="searchProgrammes" placeholder="Search programmes..." value="${escapeHtml(search)}">
      </div>
    </div>
    
    <p style="color:var(--gray-500);margin-bottom:1rem">Showing ${programmes.length} programme${programmes.length !== 1 ? 's' : ''}</p>
    
    <div class="programme-grid" id="programmeGrid">
      ${programmes.map(p => `
        <div class="programme-card" data-level="${p.level}">
          ${p.image_url ? `<img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.title)}" class="programme-image" loading="lazy">` : ''}
          <div class="programme-content">
            <span class="badge ${p.level === 'Undergraduate' ? 'badge-ug' : 'badge-pg'}">${p.level}</span>
            <h3>${escapeHtml(p.title)}</h3>
            <p>${escapeHtml(truncate(p.description, 120))}</p>
            <div class="programme-meta">
              <span>📚 ${p.duration || '3 years'}</span>
              <span>⭐ ${p.credits || 360} credits</span>
            </div>
            <a href="/programmes/${p.id}" class="btn btn-outline">View Details →</a>
          </div>
        </div>
      `).join("")}
    </div>
  `;
  
  return mainLayout(content, "Programmes", user);
}