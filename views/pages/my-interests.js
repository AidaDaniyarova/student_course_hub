// views/pages/my-interests.js
import { mainLayout } from "../layouts/mainLayout.js";
import { escapeHtml, formatDate } from "../../tools/render.js";

export function myInterestsPage(interests, email, user) {
  const rows = interests.map(i => `
    <tr>
      <td><a href="/programmes/${i.programme_id}" style="color:var(--primary);font-weight:600">${escapeHtml(i.programme_title)}</a></td>
      <td><span class="badge ${i.programme_level === 'Undergraduate' ? 'badge-ug' : 'badge-pg'}">${escapeHtml(i.programme_level)}</span></td>
      <td>${formatDate(i.created_at)}</td>
      <td><span class="badge badge-${escapeHtml(i.status)}">${escapeHtml(i.status)}</span></td>
      <td>
        <button onclick="handleWithdraw(${i.id}, '${escapeHtml(i.email)}', '${escapeHtml(i.programme_title)}')" class="btn btn-danger btn-sm">
          Withdraw
        </button>
      </td>
    </tr>`).join("");
  
  const content = `
    <h1 class="page-title">My Interests</h1>
    
    <div class="filters">
      <form method="GET" action="/my-interests" style="display:flex;gap:1rem;align-items:flex-end">
        <div class="form-group" style="flex:1">
          <label for="email">Email Address</label>
          <input type="email" id="email" name="email" value="${escapeHtml(email)}" placeholder="Enter your email" required>
        </div>
        <button type="submit" class="btn btn-primary">Find My Interests</button>
      </form>
    </div>
    
    ${email && interests.length === 0 ? `
      <div class="alert alert-info">No registered interests found for <strong>${escapeHtml(email)}</strong>.</div>
    ` : ""}
    
    ${interests.length > 0 ? `
      <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Programme</th><th>Level</th><th>Registered</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
      </div>
    ` : ""}
    
    ${!email ? `
      <div class="alert alert-info">Enter your email address above to view or manage your registered interests.</div>
    ` : ""}
  `;
  
  return mainLayout(content, "My Interests", user);
}