// views/student/index.js - Student-facing views
import { mainLayout } from "../layout/index.js";
import { escapeHtml, truncate, formatDate } from "../../tools/render.js";

export function homePage(user) {
  const content = `
    <section class="hero">
      <div class="hero-content">
        <h1>Welcome to Student Course Hub</h1>
        <p class="hero-subtitle">Discover your future with our world-class programmes</p>
        <div class="hero-buttons">
          <a href="/programmes" class="btn btn-primary">Explore Programmes</a>
          <a href="/programmes?level=Undergraduate" class="btn btn-secondary">Undergraduate</a>
          <a href="/programmes?level=Postgraduate" class="btn btn-secondary">Postgraduate</a>
        </div>
      </div>
    </section>
    
    <section class="features">
      <h2>Why Choose Us?</h2>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">🎓</div>
          <h3>World-Class Education</h3>
          <p>Learn from leading experts in their fields</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">💼</div>
          <h3>Industry Connections</h3>
          <p>Strong links with top employers</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🌍</div>
          <h3>Global Community</h3>
          <p>Students from over 100 countries</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🔬</div>
          <h3>Research Excellence</h3>
          <p>Cutting-edge research facilities</p>
        </div>
      </div>
    </section>
    
    <section class="newsletter">
      <div class="newsletter-content">
        <h2>Stay Updated</h2>
        <p>Subscribe to receive updates about open days and new programmes</p>
        <form id="newsletterForm" class="newsletter-form">
          <input type="email" id="newsletterEmail" placeholder="Your email address" required>
          <button type="submit">Subscribe</button>
        </form>
        <div id="newsletterMessage"></div>
      </div>
    </section>
  `;
  
  return mainLayout(content, "Home", user);
}

export function programmeListPage(programmes, filters, user) {
  const filterHtml = `
    <div class="filters">
      <h2>Programmes</h2>
      <div class="filter-controls">
        <button class="filter-btn ${!filters.level ? 'active' : ''}" data-level="all">All</button>
        <button class="filter-btn ${filters.level === 'Undergraduate' ? 'active' : ''}" data-level="Undergraduate">Undergraduate</button>
        <button class="filter-btn ${filters.level === 'Postgraduate' ? 'active' : ''}" data-level="Postgraduate">Postgraduate</button>
      </div>
      <div class="search-box">
        <input type="search" id="searchProgrammes" placeholder="Search programmes..." value="${escapeHtml(filters.search || '')}">
      </div>
    </div>
    
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
            <a href="/programmes/${p.slug}" class="btn btn-outline">View Details →</a>
          </div>
        </div>
      `).join("")}
    </div>
    
    ${programmes.length === 0 ? '<p class="no-results">No programmes found. Try adjusting your search.</p>' : ''}
  `;
  
  return mainLayout(filterHtml, "Programmes", user);
}

export function programmeDetailPage(programme, modulesByYear, user, isInterested = false) {
  const modulesHtml = Object.entries(modulesByYear).map(([year, modules]) => `
    <div class="year-section">
      <h3>Year ${year}</h3>
      <div class="modules-list">
        ${modules.map(m => `
          <div class="module-card">
            <div class="module-header">
              <span class="module-code">${escapeHtml(m.code)}</span>
              <span class="module-credits">${m.credits} credits</span>
            </div>
            <h4>${escapeHtml(m.title)}</h4>
            <p>${escapeHtml(m.description || 'No description available')}</p>
            ${m.module_leader_name ? `
              <div class="module-leader">
                👨‍🏫 Led by: ${escapeHtml(m.module_leader_name)}
              </div>
            ` : ''}
            ${m.is_mandatory ? '<span class="mandatory-badge">Mandatory</span>' : ''}
          </div>
        `).join("")}
      </div>
    </div>
  `).join("");
  
  const content = `
    <div class="programme-detail">
      <div class="programme-header">
        ${programme.image_url ? `<img src="${escapeHtml(programme.image_url)}" alt="${escapeHtml(programme.title)}" class="programme-hero">` : ''}
        <div class="programme-info">
          <span class="badge ${programme.level === 'Undergraduate' ? 'badge-ug' : 'badge-pg'}">${programme.level}</span>
          <h1>${escapeHtml(programme.title)}</h1>
          <p class="programme-description">${escapeHtml(programme.description)}</p>
          <div class="programme-details">
            <div class="detail-item">⏱️ ${programme.duration || '3 years full-time'}</div>
            <div class="detail-item">📊 ${programme.credits || 360} credits</div>
          </div>
        </div>
      </div>
      
      <div class="programme-structure">
        <h2>Programme Structure</h2>
        ${modulesHtml}
      </div>
      
      <div class="interest-section" id="interestSection">
        <h2>Register Your Interest</h2>
        ${isInterested ? `
          <div class="alert alert-success">
            You've already registered interest in this programme!
            <button id="withdrawInterest" class="btn btn-danger">Withdraw Interest</button>
          </div>
        ` : `
          <form id="interestForm" class="interest-form">
            <div class="form-row">
              <div class="form-group">
                <label for="name">Full Name *</label>
                <input type="text" id="name" name="name" required aria-required="true">
              </div>
              <div class="form-group">
                <label for="email">Email Address *</label>
                <input type="email" id="email" name="email" required aria-required="true">
              </div>
            </div>
            <div class="form-group">
              <label for="phone">Phone Number</label>
              <input type="tel" id="phone" name="phone">
            </div>
            <div class="form-group">
              <label for="message">Message (Optional)</label>
              <textarea id="message" rows="3"></textarea>
            </div>
            <button type="submit" class="btn btn-primary">Register Interest</button>
          </form>
        `}
        <div id="interestMessage"></div>
      </div>
      
      <div class="related-programmes" id="relatedProgrammes"></div>
    </div>
    
    <script>
      const programmeId = ${programme.id};
      const programmeSlug = '${programme.slug}';
      ${!isInterested ? `
        document.getElementById('interestForm')?.addEventListener('submit', async (e) => {
          e.preventDefault();
          const formData = {
            programme_id: programmeId,
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            message: document.getElementById('message').value
          };
          
          const response = await fetch('/api/programmes/interest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
          });
          
          const result = await response.json();
          const msgDiv = document.getElementById('interestMessage');
          
          if (response.ok) {
            msgDiv.innerHTML = '<div class="alert alert-success">' + result.message + '</div>';
            document.getElementById('interestForm').reset();
            setTimeout(() => location.reload(), 2000);
          } else {
            msgDiv.innerHTML = '<div class="alert alert-error">' + (result.errors ? result.errors.join(', ') : result.error) + '</div>';
          }
        });
      ` : `
        document.getElementById('withdrawInterest')?.addEventListener('click', async () => {
          if (confirm('Are you sure you want to withdraw your interest?')) {
            const response = await fetch('/api/programmes/${programme.id}/withdraw', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' }
            });
            if (response.ok) {
              location.reload();
            }
          }
        });
      `}
      
      // Load related programmes
      fetch('/api/programmes/${programme.id}/related')
        .then(res => res.json())
        .then(data => {
          if (data.programmes && data.programmes.length) {
            const container = document.getElementById('relatedProgrammes');
            container.innerHTML = '<h2>Related Programmes</h2><div class="programme-grid">' + 
              data.programmes.map(p => \`
                <div class="programme-card small">
                  <h3>\${p.title}</h3>
                  <a href="/programmes/\${p.slug}" class="btn btn-outline">View</a>
                </div>
              \`).join('') + '</div>';
          }
        });
    </script>
  `;
  
  return mainLayout(content, programme.title, user);
}