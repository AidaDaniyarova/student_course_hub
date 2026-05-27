// views/pages/programmes/detail.js
import { mainLayout } from "../../layouts/mainLayout.js";
import { escapeHtml, getStaffFullName } from "../../../tools/render.js";

export function programmeDetailPage(programme, modulesByYear, user, isInterested = false) {
  const yearsHtml = Object.entries(modulesByYear).sort(([a], [b]) => a - b).map(([year, modules]) => `
    <div class="year-section">
      <h3 class="year-title">Year ${escapeHtml(year)}</h3>
      <div class="modules-list">
        ${modules.map(m => {
          // Get proper full name from username or email
          let leaderFullName = null;
          if (m.leader_username) {
            leaderFullName = getStaffFullName(m.leader_username, m.leader_email);
          } else if (m.module_leader_id) {
            // Fallback to module_leader_name if available
            leaderFullName = m.leader_name || m.module_leader_name;
          }
          
          return `
            <div class="module-card">
              <div class="module-header">
                <span class="module-code">${escapeHtml(m.code)}</span>
                <span class="module-credits">${m.credits || 15} credits ${m.semester ? `· Sem ${m.semester}` : ""}</span>
              </div>
              <h4>${escapeHtml(m.title)}</h4>
              ${m.description ? `<p>${escapeHtml(m.description)}</p>` : ""}
              ${leaderFullName ? `
                <div class="module-leader">
                  👨‍🏫 Led by: ${escapeHtml(leaderFullName)}
                </div>
              ` : ''}
              ${m.is_mandatory ? '<span class="mandatory-badge">Mandatory</span>' : ''}
              ${m.shared_count > 1 ? `<span class="shared-badge">🔗 Shared across ${m.shared_count} programmes</span>` : ''}
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `).join("");
  
  const interestSection = isInterested
    ? `<div class="alert alert-success">
        ✅ You've already registered interest in this programme!
        <form method="POST" action="/api/withdraw-interest" style="display:inline">
          <input type="hidden" name="programme_id" value="${programme.id}">
          <input type="hidden" name="email" id="withdrawEmail">
          <button type="button" class="btn btn-danger btn-sm" style="margin-left:1rem"
            onclick="const email=prompt('Enter your email to confirm withdrawal:');if(email){document.getElementById('withdrawEmail').value=email;this.closest('form').submit()}">
            Withdraw Interest
          </button>
        </form>
      </div>`
    : `<form id="interestForm" class="interest-form">
        <div class="form-row">
          <div class="form-group">
            <label for="name">Full Name *</label>
            <input type="text" id="name" name="name" required>
          </div>
          <div class="form-group">
            <label for="email">Email Address *</label>
            <input type="email" id="email" name="email" required>
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
      <div id="interestMessage"></div>`;
  
  const content = `
    <div class="programme-detail">
      <div class="programme-header">
        ${programme.image_url 
          ? `<img src="${escapeHtml(programme.image_url)}" alt="${escapeHtml(programme.title)}" class="programme-image">`
          : `<div class="programme-image" style="background:var(--gray-100);display:flex;align-items:center;justify-content:center;font-size:4rem">🎓</div>`}
        <div class="programme-info">
          <span class="badge ${programme.level === 'Undergraduate' ? 'badge-ug' : 'badge-pg'}">${escapeHtml(programme.level)}</span>
          <h1>${escapeHtml(programme.title)}</h1>
          <p class="programme-description">${escapeHtml(programme.description)}</p>
          <div class="programme-details">
            ${programme.duration ? `<div class="detail-item">⏱️ ${escapeHtml(programme.duration)}</div>` : ''}
            ${programme.credits ? `<div class="detail-item">📊 ${programme.credits} credits</div>` : ''}
          </div>
        </div>
      </div>
      
      <div class="programme-structure">
        <h2>Programme Structure</h2>
        ${yearsHtml || '<p>No modules assigned yet.</p>'}
      </div>
      
      <div class="interest-section">
        <h2>Register Your Interest</h2>
        <p>Complete this form to receive updates about open days, application deadlines, and programme news.</p>
        ${interestSection}
      </div>
    </div>
    
    <script>
      const programmeId = ${programme.id};
      
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
          
          const response = await fetch('/api/register-interest', {
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
            msgDiv.innerHTML = '<div class="alert alert-error">' + (result.error || 'Something went wrong') + '</div>';
          }
        });
      ` : ''}
    </script>
  `;
  
  return mainLayout(content, programme.title, user);
}