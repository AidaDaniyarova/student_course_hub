// public/js/app.js - Client-side interactions

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', function() {
      const navLinks = document.querySelector('.nav-links');
      navLinks.classList.toggle('active');
      const expanded = navLinks.classList.contains('active');
      mobileMenuBtn.setAttribute('aria-expanded', expanded);
    });
  }
  
  // Programme filtering with client-side update
  const filterBtns = document.querySelectorAll('.filter-btn');
  if (filterBtns.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', async function(e) {
        e.preventDefault();
        const level = this.getAttribute('data-level');
        const url = level === 'all' ? '/api/programmes' : `/api/programmes?level=${level}`;
        
        try {
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            updateProgrammeGrid(data.programmes);
            
            // Update active state
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
          }
        } catch (error) {
          // Fallback to server-side navigation
          window.location.href = level === 'all' ? '/programmes' : `/programmes?level=${level}`;
        }
      });
    });
  }
  
  // Search with debounce
  const searchInput = document.getElementById('searchProgrammes');
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', function() {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(async () => {
        const searchTerm = this.value;
        const currentLevel = document.querySelector('.filter-btn.active')?.getAttribute('data-level') || '';
        const url = `/api/programmes?search=${encodeURIComponent(searchTerm)}${currentLevel && currentLevel !== 'all' ? `&level=${currentLevel}` : ''}`;
        
        try {
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            updateProgrammeGrid(data.programmes);
          }
        } catch {
          window.location.href = `/programmes?search=${encodeURIComponent(searchTerm)}`;
        }
      }, 500);
    });
  }
});

// Client-side grid update function
function updateProgrammeGrid(programmes) {
  const grid = document.getElementById('programmeGrid');
  if (!grid) return;
  
  if (programmes.length === 0) {
    grid.innerHTML = '<p class="no-results" style="text-align:center;padding:3rem;color:var(--gray-500)">No programmes found. Try adjusting your search.</p>';
    return;
  }
  
  grid.innerHTML = programmes.map(p => `
    <div class="programme-card" data-level="${escapeHtml(p.level)}">
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
  `).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '…' : str;
}

