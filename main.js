// main.js - Student Course Hub
// Run: deno run dev
// Init DB first: deno run --allow-all init-db.js

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { Database } from "jsr:@db/sqlite@0.11";

// ─── Database ────────────────────────────────────────────────────────────────
const db = new Database("course_hub.db");
db.exec("PRAGMA foreign_keys = ON");

// ─── Session Store ────────────────────────────────────────────────────────────
const sessions = new Map(); // sessionId → { id, username, role }

// ─── Helpers ─────────────────────────────────────────────────────────────────
function esc(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function trunc(str, len = 120) {
  if (!str) return "";
  return str.length > len ? str.slice(0, len) + "…" : str;
}

function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function getUser(request) {
  const cookie = request.headers.get("cookie") || "";
  const m = cookie.match(/session=([^;]+)/);
  return m ? (sessions.get(m[1]) ?? null) : null;
}

function setSession(response, user) {
  const id = crypto.randomUUID();
  sessions.set(id, user);
  response.headers.set("Set-Cookie", `session=${id}; HttpOnly; Path=/; SameSite=Lax; Max-Age=86400`);
  return id;
}

function clearSession(request, response) {
  const cookie = request.headers.get("cookie") || "";
  const m = cookie.match(/session=([^;]+)/);
  if (m) sessions.delete(m[1]);
  response.headers.set("Set-Cookie", "session=; HttpOnly; Path=/; Max-Age=0");
}

function redirect(location, headers = {}) {
  return new Response("", { status: 302, headers: { Location: location, ...headers } });
}

function html(body, status = 200) {
  return new Response(body, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

// ─── Layout ───────────────────────────────────────────────────────────────────
function layout(content, title = "Student Course Hub", user = null) {
  const isAdmin = user?.role === "admin";
  const isStaff = isAdmin || user?.role === "staff";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Explore undergraduate and postgraduate programmes at the University">
  <title>${esc(title)} | Student Course Hub</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    :root{
      --blue:#003366;--blue-dark:#002244;--blue-light:#004d99;
      --gold:#ffd700;--red:#dc2626;--green:#059669;
      --gray-50:#f9fafb;--gray-100:#f3f4f6;--gray-200:#e5e7eb;
      --gray-500:#6b7280;--gray-900:#111827;
      --shadow:0 2px 8px rgba(0,0,0,.1);--radius:8px;
    }
    *:focus-visible{outline:3px solid var(--gold);outline-offset:2px}
    .skip-link{position:absolute;top:-40px;left:0;background:var(--blue);color:#fff;
      padding:8px 16px;text-decoration:none;z-index:200;border-radius:0 0 4px 0}
    .skip-link:focus{top:0}
    body{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;line-height:1.6;
      color:var(--gray-900);background:var(--gray-50)}
    .nav{background:var(--blue);color:#fff;padding:.75rem 1.5rem;
      display:flex;justify-content:space-between;align-items:center;
      flex-wrap:wrap;gap:.5rem;position:sticky;top:0;z-index:50;
      box-shadow:0 2px 8px rgba(0,0,0,.2)}
    .nav-logo{font-size:1.25rem;font-weight:700;color:#fff;text-decoration:none}
    .nav-links{display:flex;gap:.25rem;flex-wrap:wrap;align-items:center}
    .nav-links a{color:#fff;text-decoration:none;padding:.4rem .75rem;border-radius:4px;
      font-size:.9rem;transition:background .15s}
    .nav-links a:hover,.nav-links a:focus{background:var(--blue-light)}
    .nav-links .nav-highlight{background:var(--gold);color:var(--blue);font-weight:700}
    .nav-links .nav-highlight:hover{background:#e6c200}
    .container{max-width:1200px;margin:0 auto;padding:2rem 1.5rem}
    .hero{background:linear-gradient(135deg,var(--blue) 0%,var(--blue-dark) 100%);
      color:#fff;padding:4rem 1.5rem;text-align:center}
    .hero h1{font-size:2.5rem;margin-bottom:1rem}
    .hero p{font-size:1.2rem;max-width:700px;margin:0 auto 2rem;opacity:.9}
    .hero-btns{display:flex;gap:1rem;justify-content:center;flex-wrap:wrap}
    .btn{display:inline-block;padding:.5rem 1.25rem;border-radius:6px;font-weight:600;
      cursor:pointer;border:2px solid transparent;text-decoration:none;font-size:.95rem;
      transition:all .15s;white-space:nowrap}
    .btn-primary{background:var(--gold);color:var(--blue)}
    .btn-primary:hover{background:#e6c200;transform:translateY(-1px)}
    .btn-secondary{background:transparent;border-color:#fff;color:#fff}
    .btn-secondary:hover{background:rgba(255,255,255,.15)}
    .btn-outline{border-color:var(--blue);color:var(--blue);background:transparent}
    .btn-outline:hover{background:var(--blue);color:#fff}
    .btn-danger{background:var(--red);color:#fff;border-color:var(--red)}
    .btn-danger:hover{background:#b91c1c}
    .btn-success{background:var(--green);color:#fff;border-color:var(--green)}
    .btn-success:hover{background:#047857}
    .btn-sm{padding:.3rem .75rem;font-size:.8rem}
    button.btn{border:none}
    button.btn-outline{border:2px solid var(--blue)}
    .card-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1.5rem;margin:1.5rem 0}
    .card{background:#fff;border-radius:var(--radius);overflow:hidden;
      box-shadow:var(--shadow);transition:transform .2s,box-shadow .2s}
    .card:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,.15)}
    .card img{width:100%;height:180px;object-fit:cover}
    .card-body{padding:1.25rem}
    .card-body h3{font-size:1.1rem;margin-bottom:.5rem}
    .card-body p{color:var(--gray-500);font-size:.9rem;margin-bottom:1rem}
    .card-meta{display:flex;gap:1rem;font-size:.8rem;color:var(--gray-500);margin-bottom:1rem}
    .badge{display:inline-block;padding:.2rem .6rem;border-radius:20px;
      font-size:.75rem;font-weight:700;margin-bottom:.5rem}
    .badge-ug{background:#dbeafe;color:#1e40af}
    .badge-pg{background:#fce7f3;color:#9d174d}
    .badge-published{background:#d1fae5;color:#065f46}
    .badge-draft{background:#fee2e2;color:#991b1b}
    .badge-pending{background:#fef9c3;color:#713f12}
    .badge-contacted{background:#dbeafe;color:#1e40af}
    .badge-converted{background:#d1fae5;color:#065f46}
    .alert{padding:.875rem 1rem;border-radius:var(--radius);margin:1rem 0;border-left:4px solid}
    .alert-success{background:#d1fae5;color:#065f46;border-color:var(--green)}
    .alert-error{background:#fee2e2;color:#991b1b;border-color:var(--red)}
    .alert-info{background:#dbeafe;color:#1e40af;border-color:#3b82f6}
    .form-group{margin-bottom:1rem}
    .form-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
    label{display:block;margin-bottom:.3rem;font-weight:600;font-size:.9rem}
    input,select,textarea{width:100%;padding:.5rem .75rem;border:1px solid var(--gray-200);
      border-radius:4px;font-size:1rem;background:#fff}
    input:focus,select:focus,textarea:focus{outline:none;border-color:var(--blue);
      box-shadow:0 0 0 3px rgba(0,51,102,.15)}
    .form-card{background:#fff;padding:2rem;border-radius:var(--radius);box-shadow:var(--shadow);max-width:640px}
    .table-wrap{overflow-x:auto;border-radius:var(--radius);box-shadow:var(--shadow)}
    table{width:100%;border-collapse:collapse;background:#fff}
    th{background:var(--gray-100);padding:.75rem 1rem;text-align:left;font-size:.85rem;
      font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--gray-500)}
    td{padding:.75rem 1rem;border-bottom:1px solid var(--gray-100);vertical-align:middle}
    tr:last-child td{border-bottom:none}
    tr:hover td{background:var(--gray-50)}
    .filters{background:#fff;padding:1.25rem;border-radius:var(--radius);
      box-shadow:var(--shadow);margin-bottom:1.5rem;display:flex;gap:.75rem;flex-wrap:wrap;align-items:center}
    .filter-btn{padding:.4rem .875rem;border:1px solid var(--gray-200);border-radius:20px;
      cursor:pointer;font-size:.875rem;background:#fff;transition:all .15s}
    .filter-btn.active,.filter-btn:hover{background:var(--blue);color:#fff;border-color:var(--blue)}
    .search-input{padding:.4rem .75rem;border:1px solid var(--gray-200);border-radius:20px;
      font-size:.875rem;flex:1;min-width:180px}
    .stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;margin-bottom:2rem}
    .stat-card{background:#fff;padding:1.5rem;border-radius:var(--radius);box-shadow:var(--shadow);text-align:center}
    .stat-num{font-size:2.25rem;font-weight:700;color:var(--blue)}
    .stat-label{font-size:.85rem;color:var(--gray-500);margin-top:.25rem}
    .year-section{margin-bottom:2rem}
    .year-heading{color:var(--blue);font-size:1.2rem;padding-bottom:.5rem;
      border-bottom:3px solid var(--gold);display:inline-block;margin-bottom:1rem}
    .module-card{background:var(--gray-50);border-left:4px solid var(--blue);
      border-radius:0 var(--radius) var(--radius) 0;padding:1rem;margin-bottom:.75rem}
    .module-code{font-weight:700;color:var(--blue);font-size:.9rem}
    .module-leader{font-size:.85rem;color:var(--gray-500);margin-top:.4rem}
    .section{margin:2rem 0}
    .section-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem;flex-wrap:wrap;gap:.5rem}
    .page-title{font-size:1.75rem;font-weight:700;margin-bottom:.25rem}
    .breadcrumb{font-size:.875rem;color:var(--gray-500);margin-bottom:1.5rem}
    .breadcrumb a{color:var(--blue);text-decoration:none}
    .breadcrumb a:hover{text-decoration:underline}
    .tag-actions{display:flex;gap:.5rem;flex-wrap:wrap}
    .prog-header{background:#fff;border-radius:var(--radius);overflow:hidden;box-shadow:var(--shadow);margin-bottom:2rem}
    .prog-header-img{width:100%;height:280px;object-fit:cover}
    .prog-header-body{padding:2rem}
    .prog-meta{display:flex;gap:1.5rem;margin:1rem 0;font-size:.9rem;color:var(--gray-500);flex-wrap:wrap}
    .interest-box{background:#fff;border-radius:var(--radius);padding:2rem;box-shadow:var(--shadow);margin-top:2rem}
    footer{background:var(--blue-dark);color:#fff;padding:2rem 1.5rem;margin-top:4rem;text-align:center;font-size:.875rem}
    footer a{color:var(--gold);text-decoration:none}
    @media(max-width:640px){
      .hero h1{font-size:1.75rem}
      .form-row{grid-template-columns:1fr}
      .container{padding:1.5rem 1rem}
      .filters{flex-direction:column;align-items:stretch}
      .search-input{width:100%}
      .nav-links a{padding:.3rem .5rem;font-size:.85rem}
    }
    @media print{.nav,.skip-link,footer,.interest-box,.btn{display:none}}
  </style>
</head>
<body>
  <a class="skip-link" href="#main">Skip to main content</a>
  <nav class="nav" role="navigation" aria-label="Main navigation">
    <a class="nav-logo" href="/">🎓 Student Course Hub</a>
    <div class="nav-links">
      <a href="/">Home</a>
      <a href="/programmes">Programmes</a>
      <a href="/programmes?level=Undergraduate">Undergraduate</a>
      <a href="/programmes?level=Postgraduate">Postgraduate</a>
      <a href="/my-interests">My Interests</a>
      ${isStaff ? `<a href="/admin/dashboard">Dashboard</a>` : ""}
      ${user
        ? `<a href="/logout" class="nav-highlight">Logout (${esc(user.username)})</a>`
        : `<a href="/login" class="nav-highlight">Staff Login</a>`}
    </div>
  </nav>
  <main id="main">${content}</main>
  <footer>
    <p>📍 University of Example &nbsp;|&nbsp; admissions@university.ac.uk &nbsp;|&nbsp; +44 (0)123 456 789</p>
    <p style="margin-top:.5rem">&copy; 2026 University of Example. All rights reserved. &nbsp;|&nbsp;
      <a href="/accessibility">Accessibility</a></p>
  </footer>
</body>
</html>`;
}

// ─── Student Pages ─────────────────────────────────────────────────────────────
function pageHome(user) {
  return layout(`
    <div class="hero">
      <h1>Discover Your Future</h1>
      <p>Explore world-class undergraduate and postgraduate programmes. Register your interest to receive updates about open days and application deadlines.</p>
      <div class="hero-btns">
        <a href="/programmes" class="btn btn-primary">Explore All Programmes</a>
        <a href="/programmes?level=Undergraduate" class="btn btn-secondary">Undergraduate</a>
        <a href="/programmes?level=Postgraduate" class="btn btn-secondary">Postgraduate</a>
      </div>
    </div>
    <div class="container">
      <div class="card-grid" style="margin-top:3rem">
        <div class="card" style="text-align:center;padding:2rem">
          <div style="font-size:3rem;margin-bottom:1rem">🎓</div>
          <h3>World-Class Education</h3>
          <p>Learn from leading experts and industry professionals</p>
        </div>
        <div class="card" style="text-align:center;padding:2rem">
          <div style="font-size:3rem;margin-bottom:1rem">💼</div>
          <h3>Industry Connections</h3>
          <p>Strong links with top employers and placement opportunities</p>
        </div>
        <div class="card" style="text-align:center;padding:2rem">
          <div style="font-size:3rem;margin-bottom:1rem">🌍</div>
          <h3>Global Community</h3>
          <p>Join students from over 100 countries worldwide</p>
        </div>
        <div class="card" style="text-align:center;padding:2rem">
          <div style="font-size:3rem;margin-bottom:1rem">🔬</div>
          <h3>Research Excellence</h3>
          <p>Access cutting-edge research facilities and resources</p>
        </div>
      </div>
    </div>
  `, "Home", user);
}

function pageProgrammeList(programmes, filters, user) {
  const cards = programmes.length === 0
    ? `<p style="grid-column:1/-1;color:var(--gray-500);text-align:center;padding:3rem">No programmes found. Try adjusting your search.</p>`
    : programmes.map(p => `
      <div class="card">
        ${p.image_url
          ? `<img src="${esc(p.image_url)}" alt="${esc(p.title)}" loading="lazy">`
          : `<div style="height:180px;background:var(--gray-100);display:flex;align-items:center;justify-content:center;font-size:3rem">📚</div>`}
        <div class="card-body">
          <span class="badge ${p.level === "Undergraduate" ? "badge-ug" : "badge-pg"}">${esc(p.level)}</span>
          <h3>${esc(p.title)}</h3>
          <p>${esc(trunc(p.description))}</p>
          <div class="card-meta">
            <span>⏱ ${esc(p.duration || "3 years")}</span>
            <span>📊 ${p.credits || 360} credits</span>
          </div>
          <a href="/programmes/${p.id}" class="btn btn-outline btn-sm">View Details →</a>
        </div>
      </div>`).join("");

  const lvl = filters.level || "";
  const q = filters.search || "";

  return layout(`
    <div class="container">
      <h1 class="page-title" style="margin-top:1.5rem">Programmes</h1>
      <div class="filters" role="search" aria-label="Filter programmes">
        <div style="display:flex;gap:.5rem;flex-wrap:wrap">
          <a href="/programmes" class="filter-btn ${!lvl ? "active" : ""}">All</a>
          <a href="/programmes?level=Undergraduate${q ? "&search="+encodeURIComponent(q) : ""}" class="filter-btn ${lvl === "Undergraduate" ? "active" : ""}">Undergraduate</a>
          <a href="/programmes?level=Postgraduate${q ? "&search="+encodeURIComponent(q) : ""}" class="filter-btn ${lvl === "Postgraduate" ? "active" : ""}">Postgraduate</a>
        </div>
        <form method="GET" action="/programmes" style="display:flex;gap:.5rem;flex:1">
          ${lvl ? `<input type="hidden" name="level" value="${esc(lvl)}">` : ""}
          <input class="search-input" type="search" name="search" placeholder="Search programmes…" value="${esc(q)}" aria-label="Search programmes">
          <button class="btn btn-primary btn-sm" type="submit">Search</button>
        </form>
      </div>
      <p style="color:var(--gray-500);font-size:.9rem;margin-bottom:1rem">Showing ${programmes.length} programme${programmes.length !== 1 ? "s" : ""}</p>
      <div class="card-grid">${cards}</div>
    </div>
  `, "Programmes", user);
}

function pageProgrammeDetail(programme, modulesByYear, user, alreadyInterested = false) {
  // Get leader names from users table
  const leaderNames = {};
  const staffUsers = db.prepare("SELECT id, username FROM users WHERE role IN ('staff', 'admin')").all();
  for (const s of staffUsers) {
    leaderNames[s.id] = s.username;
  }

  const yearsHtml = Object.entries(modulesByYear).sort(([a], [b]) => a - b).map(([year, mods]) => `
    <div class="year-section">
      <h3 class="year-heading">Year ${esc(year)}</h3>
      ${mods.map(m => `
        <div class="module-card">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:.5rem">
            <span class="module-code">${esc(m.code)}</span>
            <span style="font-size:.8rem;color:var(--gray-500)">${m.credits || 15} credits ${m.semester ? `· Sem ${m.semester}` : ""} ${m.is_mandatory ? "· <strong>Mandatory</strong>" : ""}</span>
          </div>
          <strong>${esc(m.title)}</strong>
          ${m.description ? `<p style="font-size:.875rem;color:var(--gray-500);margin-top:.25rem">${esc(m.description)}</p>` : ""}
          ${m.module_leader_id && leaderNames[m.module_leader_id] 
            ? `<div class="module-leader">👨‍🏫 Led by: ${esc(leaderNames[m.module_leader_id])}</div>` 
            : m.module_leader_name 
              ? `<div class="module-leader">👨‍🏫 Led by: ${esc(m.module_leader_name)}</div>`
              : ""}
          ${m.shared_count > 1 ? `<span style="font-size:.75rem;color:#7c3aed">🔗 Shared across ${m.shared_count} programmes</span>` : ""}
        </div>`).join("")}
    </div>`).join("");

  const interestSection = alreadyInterested
    ? `<div class="alert alert-success">
        ✅ You've already registered interest in this programme.
        <form method="POST" action="/api/withdraw-interest" style="display:inline">
          <input type="hidden" name="programme_id" value="${programme.id}">
          <input type="hidden" name="email" id="withdrawEmail">
          <button type="button" class="btn btn-danger btn-sm" style="margin-left:1rem"
            onclick="document.getElementById('withdrawEmail').value=prompt('Enter your email to confirm withdrawal');this.closest('form').submit()">
            Withdraw Interest
          </button>
        </form>
       </div>`
    : `<form id="interestForm">
        <div class="form-row">
          <div class="form-group">
            <label for="intName">Full Name *</label>
            <input id="intName" type="text" required placeholder="Jane Smith">
          </div>
          <div class="form-group">
            <label for="intEmail">Email Address *</label>
            <input id="intEmail" type="email" required placeholder="jane@example.com">
          </div>
        </div>
        <div class="form-group">
          <label for="intPhone">Phone Number (optional)</label>
          <input id="intPhone" type="tel" placeholder="+44 7700 000000">
        </div>
        <div class="form-group">
          <label for="intMsg">Message (optional)</label>
          <textarea id="intMsg" rows="3" placeholder="Any questions or comments…"></textarea>
        </div>
        <button type="submit" class="btn btn-primary">Register My Interest</button>
      </form>
      <div id="intResult"></div>
      <script>
        document.getElementById('interestForm').addEventListener('submit', async e => {
          e.preventDefault();
          const btn = e.target.querySelector('button');
          btn.disabled = true; btn.textContent = 'Submitting…';
          const r = await fetch('/api/register-interest', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body:JSON.stringify({
              programme_id:${programme.id},
              name:document.getElementById('intName').value,
              email:document.getElementById('intEmail').value,
              phone:document.getElementById('intPhone').value,
              message:document.getElementById('intMsg').value
            })
          });
          const d = await r.json();
          document.getElementById('intResult').innerHTML = r.ok
            ? '<div class="alert alert-success">'+d.message+'</div>'
            : '<div class="alert alert-error">'+(d.error||d.errors?.join(', ')||'Something went wrong')+'</div>';
          if(r.ok){ e.target.reset(); }
          btn.disabled = false; btn.textContent = 'Register My Interest';
        });
      </script>`;

  return layout(`
    <div class="container">
      <div class="breadcrumb" aria-label="Breadcrumb">
        <a href="/">Home</a> › <a href="/programmes">Programmes</a> › ${esc(programme.title)}
      </div>
      <div class="prog-header">
        ${programme.image_url ? `<img class="prog-header-img" src="${esc(programme.image_url)}" alt="${esc(programme.title)}">` : ""}
        <div class="prog-header-body">
          <span class="badge ${programme.level === "Undergraduate" ? "badge-ug" : "badge-pg"}">${esc(programme.level)}</span>
          <h1 style="font-size:2rem;margin-top:.5rem">${esc(programme.title)}</h1>
          <p style="color:var(--gray-500);margin-top:.75rem;line-height:1.8">${esc(programme.description)}</p>
          <div class="prog-meta">
            ${programme.duration ? `<span>⏱ ${esc(programme.duration)}</span>` : ""}
            ${programme.credits ? `<span>📊 ${programme.credits} credits</span>` : ""}
          </div>
        </div>
      </div>

      <div class="section">
        <h2 style="font-size:1.4rem;margin-bottom:1.5rem">Programme Structure</h2>
        ${yearsHtml || "<p>No modules assigned yet.</p>"}
      </div>

      <div class="interest-box">
        <h2 style="font-size:1.4rem;margin-bottom:1rem">Register Your Interest</h2>
        <p style="color:var(--gray-500);margin-bottom:1.5rem">
          Complete this form to receive updates about open days, application deadlines, and programme news.
        </p>
        ${interestSection}
      </div>
    </div>
  `, programme.title, user);
}

function pageMyInterests(interests, email, user) {
  const rows = interests.map(i => `
    <tr>
      <td><a href="/programmes/${i.programme_id}" style="color:var(--blue);text-decoration:none;font-weight:600">${esc(i.programme_title)}</a></td>
      <td><span class="badge ${i.programme_level === "Undergraduate" ? "badge-ug" : "badge-pg"}">${esc(i.programme_level)}</span></td>
      <td>${fmtDate(i.created_at)}</td>
      <td><span class="badge badge-${esc(i.status || "pending")}">${esc(i.status || "pending")}</span></td>
      <td>
        <form method="POST" action="/api/withdraw-interest" onsubmit="return confirm('Withdraw interest?')">
          <input type="hidden" name="interest_id" value="${i.id}">
          <input type="hidden" name="email" value="${esc(i.email)}">
          <input type="hidden" name="redirect" value="/my-interests?email=${encodeURIComponent(email)}">
          <button type="submit" class="btn btn-danger btn-sm">Withdraw</button>
        </form>
      </td>
    </tr>`).join("");

  return layout(`
    <div class="container">
      <h1 class="page-title" style="margin-top:1.5rem">My Interests</h1>
      <form method="GET" action="/my-interests" class="filters">
        <label style="font-weight:600;white-space:nowrap">Look up your registrations:</label>
        <input class="search-input" type="email" name="email" placeholder="Enter your email address" value="${esc(email)}" required aria-label="Email address">
        <button class="btn btn-primary btn-sm" type="submit">Find My Interests</button>
      </form>
      ${email && interests.length === 0
        ? `<div class="alert alert-info">No registered interests found for <strong>${esc(email)}</strong>.</div>`
        : ""}
      ${interests.length > 0 ? `
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Programme</th><th>Level</th><th>Registered</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>` : ""}
      ${!email ? `<div class="alert alert-info">Enter your email address above to view or manage your registered interests.</div>` : ""}
    </div>
  `, "My Interests", user);
}

function pageLogin(error = "") {
  return layout(`
    <div class="container" style="max-width:420px;padding-top:4rem">
      <div class="form-card" style="max-width:100%">
        <h1 style="font-size:1.75rem;margin-bottom:.5rem">Staff Login</h1>
        <p style="color:var(--gray-500);margin-bottom:1.5rem">Access the administration dashboard</p>
        ${error ? `<div class="alert alert-error">${esc(error)}</div>` : ""}
        <form method="POST" action="/login">
          <div class="form-group">
            <label for="username">Username</label>
            <input id="username" name="username" type="text" required autocomplete="username" autofocus>
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input id="password" name="password" type="password" required autocomplete="current-password">
          </div>
          <button class="btn btn-primary" type="submit" style="width:100%">Login</button>
        </form>
        <p style="margin-top:1rem;font-size:.8rem;color:var(--gray-500)">
          Demo: <code>admin / admin123</code> &nbsp;·&nbsp; <code>sjohnson / staff123</code>
        </p>
      </div>
    </div>
  `, "Login");
}

// ─── Admin Pages ───────────────────────────────────────────────────────────────
function pageAdminDashboard(user) {
  const stats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM programmes) as prog_count,
      (SELECT COUNT(*) FROM programmes WHERE published=1) as prog_pub,
      (SELECT COUNT(*) FROM modules) as mod_count,
      (SELECT COUNT(*) FROM student_interests) as int_count,
      (SELECT COUNT(DISTINCT email) FROM student_interests) as uniq_students,
      (SELECT COUNT(*) FROM users WHERE role IN ('staff','admin')) as staff_count
  `).get();

  const recent = db.prepare(`
    SELECT si.name, si.email, p.title as prog, si.created_at
    FROM student_interests si JOIN programmes p ON si.programme_id=p.id
    ORDER BY si.created_at DESC LIMIT 5
  `).all();

  return layout(`
    <div class="container">
      <div style="margin-top:1.5rem" class="section-header">
        <h1 class="page-title">Admin Dashboard</h1>
      </div>
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-num">${stats.prog_count}</div><div class="stat-label">Total Programmes</div></div>
        <div class="stat-card"><div class="stat-num">${stats.prog_pub}</div><div class="stat-label">Published</div></div>
        <div class="stat-card"><div class="stat-num">${stats.mod_count}</div><div class="stat-label">Modules</div></div>
        <div class="stat-card"><div class="stat-num">${stats.int_count}</div><div class="stat-label">Interests Registered</div></div>
        <div class="stat-card"><div class="stat-num">${stats.uniq_students}</div><div class="stat-label">Unique Students</div></div>
        <div class="stat-card"><div class="stat-num">${stats.staff_count}</div><div class="stat-label">Staff Members</div></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-bottom:2rem">
        <a href="/admin/programmes" class="card" style="padding:1.5rem;text-align:center;text-decoration:none;color:inherit">
          <div style="font-size:2.5rem">📚</div><strong>Manage Programmes</strong>
        </a>
        <a href="/admin/modules" class="card" style="padding:1.5rem;text-align:center;text-decoration:none;color:inherit">
          <div style="font-size:2.5rem">📋</div><strong>Manage Modules</strong>
        </a>
        <a href="/admin/interests" class="card" style="padding:1.5rem;text-align:center;text-decoration:none;color:inherit">
          <div style="font-size:2.5rem">📧</div><strong>Mailing List</strong>
        </a>
        <a href="/admin/staff" class="card" style="padding:1.5rem;text-align:center;text-decoration:none;color:inherit">
          <div style="font-size:2.5rem">👥</div><strong>Staff</strong>
        </a>
      </div>
      ${recent.length ? `
        <h2 style="font-size:1.25rem;margin-bottom:1rem">Recent Interest Registrations</h2>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Programme</th><th>Date</th></tr></thead>
            <tbody>${recent.map(r => `
              <tr>
                <td>${esc(r.name)}</td>
                <td>${esc(r.email)}</td>
                <td>${esc(r.prog)}</td>
                <td>${fmtDate(r.created_at)}</td>
              </tr>`).join("")}
            </tbody>
          </table>
        </div>` : ""}
    </div>
  `, "Admin Dashboard", user);
}

function pageAdminProgrammes(user) {
  const programmes = db.prepare(`
    SELECT p.*, 
      (SELECT COUNT(*) FROM programme_modules WHERE programme_id=p.id) as module_count,
      (SELECT COUNT(*) FROM student_interests WHERE programme_id=p.id) as interest_count
    FROM programmes p ORDER BY level, title
  `).all();

  const rows = programmes.map(p => `
    <tr>
      <td>${esc(p.title)}</td>
      <td><span class="badge ${p.level === "Undergraduate" ? "badge-ug" : "badge-pg"}">${esc(p.level)}</span></td>
      <td>${p.module_count}</td>
      <td>${p.interest_count}</td>
      <td><span class="badge ${p.published ? "badge-published" : "badge-draft"}">${p.published ? "Published" : "Draft"}</span></td>
      <td>
        <div class="tag-actions">
          <a href="/admin/programmes/${p.id}/edit" class="btn btn-outline btn-sm">Edit</a>
          <a href="/admin/programmes/${p.id}/modules" class="btn btn-outline btn-sm">Modules</a>
          <a href="/admin/interests?programme_id=${p.id}" class="btn btn-outline btn-sm">Interests</a>
          <form method="POST" action="/admin/programmes/${p.id}/toggle" style="display:inline">
            <button type="submit" class="btn btn-sm ${p.published ? "btn-danger" : "btn-success"}">
              ${p.published ? "Unpublish" : "Publish"}
            </button>
          </form>
          <form method="POST" action="/admin/programmes/${p.id}/delete" style="display:inline" onsubmit="return confirm('Delete this programme?')">
            <button type="submit" class="btn btn-danger btn-sm">Delete</button>
          </form>
        </div>
      </td>
    </tr>`).join("");

  return layout(`
    <div class="container">
      <div class="section-header" style="margin-top:1.5rem">
        <div>
          <div class="breadcrumb"><a href="/admin/dashboard">Dashboard</a> › Programmes</div>
          <h1 class="page-title">Programmes</h1>
        </div>
        <a href="/admin/programmes/new" class="btn btn-primary">+ New Programme</a>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Title</th><th>Level</th><th>Modules</th><th>Interests</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `, "Programmes", user);
}

function pageProgrammeForm(user, programme = null, error = "") {
  const title = programme ? "Edit Programme" : "New Programme";
  const action = programme ? `/admin/programmes/${programme.id}/edit` : "/admin/programmes/new";
  const v = programme || {};
  return layout(`
    <div class="container" style="max-width:720px">
      <div class="breadcrumb" style="margin-top:1.5rem">
        <a href="/admin/dashboard">Dashboard</a> › <a href="/admin/programmes">Programmes</a> › ${title}
      </div>
      <h1 class="page-title">${title}</h1>
      ${error ? `<div class="alert alert-error">${esc(error)}</div>` : ""}
      <div class="form-card" style="max-width:100%">
        <form method="POST" action="${action}">
          <div class="form-group">
            <label for="ptitle">Title *</label>
            <input id="ptitle" name="title" type="text" required maxlength="100" value="${esc(v.title || "")}">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="level">Level *</label>
              <select id="level" name="level" required>
                <option value="">Select level…</option>
                <option value="Undergraduate" ${v.level === "Undergraduate" ? "selected" : ""}>Undergraduate</option>
                <option value="Postgraduate" ${v.level === "Postgraduate" ? "selected" : ""}>Postgraduate</option>
              </select>
            </div>
            <div class="form-group">
              <label for="duration">Duration</label>
              <input id="duration" name="duration" type="text" maxlength="50" value="${esc(v.duration || "")}" placeholder="e.g. 3 years full-time">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="credits">Total Credits</label>
              <input id="credits" name="credits" type="number" min="0" max="500" value="${v.credits || 360}">
            </div>
            <div class="form-group">
              <label for="image_url">Image URL</label>
              <input id="image_url" name="image_url" type="url" value="${esc(v.image_url || "")}" placeholder="https://…">
            </div>
          </div>
          <div class="form-group">
            <label for="description">Description *</label>
            <textarea id="description" name="description" rows="5" required minlength="20">${esc(v.description || "")}</textarea>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" name="published" value="1" ${v.published ? "checked" : ""}>
              &nbsp;Published (visible to students)
            </label>
          </div>
          <div style="display:flex;gap:1rem;margin-top:1rem">
            <button type="submit" class="btn btn-primary">Save Programme</button>
            <a href="/admin/programmes" class="btn btn-outline">Cancel</a>
          </div>
        </form>
      </div>
    </div>
  `, title, user);
}

function pageAdminProgrammeModules(user, programme, allModules, assigned) {
  const assignedIds = new Set(assigned.map(m => m.id));
  return layout(`
    <div class="container">
      <div class="breadcrumb" style="margin-top:1.5rem">
        <a href="/admin/dashboard">Dashboard</a> › <a href="/admin/programmes">Programmes</a> › ${esc(programme.title)} › Modules
      </div>
      <h1 class="page-title">Manage Modules: ${esc(programme.title)}</h1>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem;margin-top:1.5rem">
        <div>
          <h2 style="font-size:1.1rem;margin-bottom:1rem">Assigned Modules (${assigned.length})</h2>
          ${assigned.length === 0 ? "<p style='color:var(--gray-500)'>No modules assigned.</p>" : ""}
          ${assigned.map(m => `
            <div class="module-card" style="display:flex;justify-content:space-between;align-items:center">
              <div>
                <span class="module-code">${esc(m.code)}</span>
                <div>${esc(m.title)}</div>
                <div style="font-size:.8rem;color:var(--gray-500)">Year ${m.year || "—"} · ${m.credits || 15} credits</div>
              </div>
              <form method="POST" action="/admin/programmes/${programme.id}/modules/remove">
                <input type="hidden" name="module_id" value="${m.id}">
                <button type="submit" class="btn btn-danger btn-sm">Remove</button>
              </form>
            </div>`).join("")}
        </div>
        <div>
          <h2 style="font-size:1.1rem;margin-bottom:1rem">Available Modules</h2>
          <form method="POST" action="/admin/programmes/${programme.id}/modules/add">
            <div class="form-group">
              <label for="module_id">Select Module</label>
              <select id="module_id" name="module_id" required>
                <option value="">Choose module…</option>
                ${allModules.filter(m => !assignedIds.has(m.id)).map(m =>
                  `<option value="${m.id}">${esc(m.code)}: ${esc(m.title)} (Year ${m.year || "?"})</option>`
                ).join("")}
              </select>
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" name="is_mandatory" value="1" checked>
                &nbsp;Mandatory module
              </label>
            </div>
            <button type="submit" class="btn btn-primary btn-sm">Add Module</button>
          </form>
        </div>
      </div>
    </div>
  `, "Manage Modules", user);
}

function pageAdminModules(user) {
  const modules = db.prepare(`
    SELECT m.*, 
      u.username as leader_username,
      (SELECT COUNT(*) FROM programme_modules WHERE module_id=m.id) as prog_count
    FROM modules m
    LEFT JOIN users u ON m.module_leader_id = u.id
    ORDER BY m.year, m.semester, m.code
  `).all();

  const rows = modules.map(m => `
    <tr>
      <td><strong>${esc(m.code)}</strong></td>
      <td>${esc(m.title)}</td>
      <td>${m.year || "—"}</td>
      <td>${m.semester || "—"}</td>
      <td>${m.credits || 15}</td>
      <td>${esc(m.leader_username || m.module_leader_name || "—")}</td>
      <td>${m.prog_count}</td>
      <td>
        <div class="tag-actions">
          <a href="/admin/modules/${m.id}/edit" class="btn btn-outline btn-sm">Edit</a>
          <form method="POST" action="/admin/modules/${m.id}/delete" style="display:inline" onsubmit="return confirm('Delete module ${esc(m.code)}?')">
            <button type="submit" class="btn btn-danger btn-sm">Delete</button>
          </form>
        </div>
      </td>
    </tr>`).join("");

  return layout(`
    <div class="container">
      <div class="section-header" style="margin-top:1.5rem">
        <div>
          <div class="breadcrumb"><a href="/admin/dashboard">Dashboard</a> › Modules</div>
          <h1 class="page-title">Modules</h1>
        </div>
        <a href="/admin/modules/new" class="btn btn-primary">+ New Module</a>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Code</th><th>Title</th><th>Year</th><th>Sem</th><th>Credits</th><th>Leader</th><th>Programmes</th><th>Actions</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `, "Modules", user);
}

function pageModuleForm(user, module_ = null, error = "") {
  const title = module_ ? "Edit Module" : "New Module";
  const action = module_ ? `/admin/modules/${module_.id}/edit` : "/admin/modules/new";
  const v = module_ || {};
  const staff = db.prepare("SELECT id, username, email FROM users WHERE role IN ('admin','staff') ORDER BY username").all();
  return layout(`
    <div class="container" style="max-width:720px">
      <div class="breadcrumb" style="margin-top:1.5rem">
        <a href="/admin/dashboard">Dashboard</a> › <a href="/admin/modules">Modules</a> › ${title}
      </div>
      <h1 class="page-title">${title}</h1>
      ${error ? `<div class="alert alert-error">${esc(error)}</div>` : ""}
      <div class="form-card" style="max-width:100%">
        <form method="POST" action="${action}">
          <div class="form-row">
            <div class="form-group">
              <label for="code">Module Code *</label>
              <input id="code" name="code" type="text" required maxlength="20" value="${esc(v.code || "")}" placeholder="e.g. CS101">
            </div>
            <div class="form-group">
              <label for="mtitle">Title *</label>
              <input id="mtitle" name="title" type="text" required maxlength="200" value="${esc(v.title || "")}">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="year">Year</label>
              <select id="year" name="year">
                <option value="">—</option>
                ${[1,2,3,4].map(y => `<option value="${y}" ${v.year == y ? "selected" : ""}>${y}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label for="semester">Semester</label>
              <select id="semester" name="semester">
                <option value="">—</option>
                ${[1,2].map(s => `<option value="${s}" ${v.semester == s ? "selected" : ""}>${s}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="credits">Credits</label>
              <input id="credits" name="credits" type="number" min="0" max="60" value="${v.credits || 15}">
            </div>
            <div class="form-group">
              <label for="module_leader_id">Module Leader (Staff)</label>
              <select id="module_leader_id" name="module_leader_id">
                <option value="">— Select Staff Member —</option>
                ${staff.map(s => `<option value="${s.id}" ${v.module_leader_id == s.id ? "selected" : ""}>${esc(s.username)} (${esc(s.email || "")})</option>`).join("")}
              </select>
              <small style="color:var(--gray-500);font-size:.75rem">Select a staff member as module leader</small>
            </div>
          </div>
          <div class="form-group">
            <label for="description">Description</label>
            <textarea id="description" name="description" rows="4">${esc(v.description || "")}</textarea>
          </div>
          <div class="form-group">
            <label for="image_url">Image URL</label>
            <input id="image_url" name="image_url" type="url" value="${esc(v.image_url || "")}" placeholder="https://…">
          </div>
          <div style="display:flex;gap:1rem;margin-top:1rem">
            <button type="submit" class="btn btn-primary">Save Module</button>
            <a href="/admin/modules" class="btn btn-outline">Cancel</a>
          </div>
        </form>
      </div>
    </div>
  `, title, user);
}

function pageAdminInterests(user, interests, programmes, selectedProgramme = "") {
  const rows = interests.map(i => `
    <tr>
      <td>${esc(i.name)}</td>
      <td><a href="mailto:${esc(i.email)}">${esc(i.email)}</a></td>
      <td>${esc(i.phone || "—")}</td>
      <td>${esc(i.programme_title)}</td>
      <td>${fmtDate(i.created_at)}</td>
      <td>
        <form method="POST" action="/admin/interests/${i.id}/status" style="display:flex;gap:.3rem;align-items:center">
          <select name="status" style="padding:.2rem;font-size:.8rem" onchange="this.form.submit()">
            ${["pending","contacted","converted"].map(s => `<option value="${s}" ${i.status === s ? "selected" : ""}>${s}</option>`).join("")}
          </select>
        </form>
      </td>
      <td>
        <form method="POST" action="/admin/interests/${i.id}/delete" onsubmit="return confirm('Delete this registration?')">
          <button type="submit" class="btn btn-danger btn-sm">Delete</button>
        </form>
      </td>
    </tr>`).join("");

  const exportUrl = selectedProgramme
    ? `/admin/interests/export?programme_id=${selectedProgramme}`
    : "/admin/interests/export";

  return layout(`
    <div class="container">
      <div class="section-header" style="margin-top:1.5rem">
        <div>
          <div class="breadcrumb"><a href="/admin/dashboard">Dashboard</a> › Mailing List</div>
          <h1 class="page-title">Mailing List & Interests</h1>
        </div>
        <a href="${exportUrl}" class="btn btn-primary">⬇ Export CSV</a>
      </div>
      <form method="GET" action="/admin/interests" class="filters">
        <label style="font-weight:600;white-space:nowrap">Filter by programme:</label>
        <select name="programme_id" class="search-input" style="border-radius:4px">
          <option value="">All Programmes</option>
          ${programmes.map(p => `<option value="${p.id}" ${selectedProgramme == p.id ? "selected" : ""}>${esc(p.title)}</option>`).join("")}
        </select>
        <button type="submit" class="btn btn-primary btn-sm">Filter</button>
        ${selectedProgramme ? `<a href="/admin/interests" class="btn btn-outline btn-sm">Clear</a>` : ""}
      </form>
      <p style="color:var(--gray-500);font-size:.9rem;margin-bottom:1rem">${interests.length} record${interests.length !== 1 ? "s" : ""}</p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Programme</th><th>Registered</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>${rows || "<tr><td colspan='7' style='text-align:center;color:var(--gray-500);padding:2rem'>No registrations found.</td></td></table>"}</tbody>
        </table>
      </div>
    </div>
  `, "Mailing List", user);
}

function pageAdminStaff(user) {
  const staff = db.prepare(`
    SELECT u.*,
      (SELECT COUNT(*) FROM modules WHERE module_leader_id = u.id) as mod_count
    FROM users u WHERE u.role IN ('admin','staff') ORDER BY u.role, u.username
  `).all();

  const rows = staff.map(s => `
    <tr>
      <td><strong>${esc(s.username)}</strong></td>
      <td>${esc(s.email || "—")}</td>
      <td><span class="badge ${s.role === "admin" ? "badge-pg" : "badge-ug"}">${esc(s.role)}</span></td>
      <td>${s.mod_count}</td>
      <td>${fmtDate(s.created_at)}</td>
      ${s.role !== "admin"
        ? `<td><form method="POST" action="/admin/staff/${s.id}/delete" onsubmit="return confirm('Remove staff member?')">
             <button type="submit" class="btn btn-danger btn-sm">Remove</button>
           </form></td>`
        : "<td>—</td>"}
    </tr>`).join("");

  return layout(`
    <div class="container">
      <div class="section-header" style="margin-top:1.5rem">
        <div>
          <div class="breadcrumb"><a href="/admin/dashboard">Dashboard</a> › Staff</div>
          <h1 class="page-title">Staff Members</h1>
        </div>
        <a href="/admin/staff/new" class="btn btn-primary">+ Add Staff</a>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Username</th><th>Email</th><th>Role</th><th>Modules Led</th><th>Joined</th><th>Action</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `, "Staff", user);
}

function pageAddStaff(user, error = "") {
  return layout(`
    <div class="container" style="max-width:500px">
      <div class="breadcrumb" style="margin-top:1.5rem">
        <a href="/admin/dashboard">Dashboard</a> › <a href="/admin/staff">Staff</a> › Add Staff
      </div>
      <h1 class="page-title">Add Staff Member</h1>
      ${error ? `<div class="alert alert-error">${esc(error)}</div>` : ""}
      <div class="form-card" style="max-width:100%">
        <form method="POST" action="/admin/staff/new">
          <div class="form-group">
            <label for="username">Username *</label>
            <input id="username" name="username" type="text" required>
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input id="email" name="email" type="email">
          </div>
          <div class="form-group">
            <label for="password">Password *</label>
            <input id="password" name="password" type="password" required>
          </div>
          <div class="form-group">
            <label for="role">Role</label>
            <select id="role" name="role">
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div style="display:flex;gap:1rem;margin-top:1rem">
            <button type="submit" class="btn btn-primary">Add Staff Member</button>
            <a href="/admin/staff" class="btn btn-outline">Cancel</a>
          </div>
        </form>
      </div>
    </div>
  `, "Add Staff", user);
}

// ─── Staff Portal ──────────────────────────────────────────────────────────────
function pageStaffPortal(user) {
  const modules = db.prepare(`
    SELECT m.*, COUNT(DISTINCT pm.programme_id) as prog_count
    FROM modules m
    LEFT JOIN programme_modules pm ON m.id = pm.module_id
    WHERE m.module_leader_id = ?
    GROUP BY m.id ORDER BY m.year, m.code
  `).all(user.id);

  const rows = modules.map(m => `
    <tr>
      <td><strong>${esc(m.code)}</strong></td>
      <td>${esc(m.title)}</td>
      <td>${m.year || "—"}</td>
      <td>${m.semester || "—"}</td>
      <td>${m.credits || 15}</td>
      <td>${m.prog_count} programme${m.prog_count !== 1 ? "s" : ""}</td>
    </tr>`).join("");

  return layout(`
    <div class="container">
      <h1 class="page-title" style="margin-top:1.5rem">Staff Portal — ${esc(user.username)}</h1>
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-num">${modules.length}</div><div class="stat-label">Modules Led</div></div>
        <div class="stat-card"><div class="stat-num">${modules.reduce((s, m) => s + (m.credits || 0), 0)}</div><div class="stat-label">Total Credits</div></div>
      </div>
      <h2 style="font-size:1.2rem;margin-bottom:1rem">My Modules</h2>
      ${modules.length === 0
        ? `<div class="alert alert-info">No modules currently assigned to you as module leader.</div>`
        : `<div class="table-wrap"><table>
            <thead><tr><th>Code</th><th>Title</th><th>Year</th><th>Semester</th><th>Credits</th><th>Shared With</th></tr></thead>
            <tbody>${rows}</tbody>
          </table></div>`}
    </div>
  `, "Staff Portal", user);
}

// ─── Sanitise input ────────────────────────────────────────────────────────────
function sanitize(s) {
  if (s === null || s === undefined) return "";
  return String(s).replace(/<[^>]*>/g, "").replace(/javascript:/gi, "").trim();
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ─── Request handler ───────────────────────────────────────────────────────────
async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  const user = getUser(request);

  console.log(`[${method}] ${path}`);

  // ── Student Routes ────────────────────────────────────────────────────────
  if (path === "/" && method === "GET")
    return html(pageHome(user));

  if (path === "/programmes" && method === "GET") {
    const filters = {
      level: url.searchParams.get("level") || "",
      search: url.searchParams.get("search") || ""
    };
    let sql = "SELECT * FROM programmes WHERE published=1";
    const params = [];
    if (filters.level) { sql += " AND level=?"; params.push(filters.level); }
    if (filters.search) { sql += " AND (title LIKE ? OR description LIKE ?)"; params.push(`%${filters.search}%`, `%${filters.search}%`); }
    sql += " ORDER BY level, title";
    const programmes = db.prepare(sql).all(...params);
    return html(pageProgrammeList(programmes, filters, user));
  }

  if (path.match(/^\/programmes\/\d+$/) && method === "GET") {
    const id = parseInt(path.split("/")[2]);
    const programme = db.prepare("SELECT * FROM programmes WHERE id=? AND published=1").get(id);
    if (!programme) return html(layout(`<div class="container" style="padding:4rem;text-align:center"><h1>Programme Not Found</h1><a href="/programmes" class="btn btn-primary" style="margin-top:1rem">Browse Programmes</a></div>`, "Not Found", user), 404);
    const modules = db.prepare(`
      SELECT m.*, pm.is_mandatory,
        (SELECT COUNT(*) FROM programme_modules WHERE module_id=m.id) as shared_count
      FROM modules m JOIN programme_modules pm ON m.id=pm.module_id
      WHERE pm.programme_id=? ORDER BY m.year, m.semester, m.code
    `).all(id);
    const byYear = {};
    for (const m of modules) { const y = m.year || 1; if (!byYear[y]) byYear[y] = []; byYear[y].push(m); }
    return html(pageProgrammeDetail(programme, byYear, user));
  }

  if (path === "/my-interests" && method === "GET") {
    const email = url.searchParams.get("email") || "";
    let interests = [];
    if (email) {
      interests = db.prepare(`
        SELECT si.*, p.title as programme_title, p.level as programme_level
        FROM student_interests si JOIN programmes p ON si.programme_id=p.id
        WHERE si.email=? ORDER BY si.created_at DESC
      `).all(email);
    }
    return html(pageMyInterests(interests, email, user));
  }

  // ── API ───────────────────────────────────────────────────────────────────
  if (path === "/api/register-interest" && method === "POST") {
    const body = await request.json();
    const name = sanitize(body.name);
    const email = sanitize(body.email);
    const phone = sanitize(body.phone || "");
    const message = sanitize(body.message || "");
    const programme_id = parseInt(body.programme_id);

    if (!name || name.length < 2) return json({ error: "Name is required (min 2 characters)" }, 400);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Valid email is required" }, 400);
    if (!programme_id) return json({ error: "Programme is required" }, 400);
    if (phone && !/^[+\d\s\-().]{7,20}$/.test(phone)) return json({ error: "Invalid phone number" }, 400);

    const prog = db.prepare("SELECT id FROM programmes WHERE id=? AND published=1").get(programme_id);
    if (!prog) return json({ error: "Programme not found" }, 404);

    db.prepare("INSERT INTO student_interests (name,email,phone,programme_id,message) VALUES (?,?,?,?,?)")
      .run(name, email, phone || null, programme_id, message || null);
    return json({ message: "Thank you! We'll send updates about this programme to your email." });
  }

  if (path === "/api/withdraw-interest" && method === "POST") {
    let interest_id, email;
    const ct = request.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const b = await request.json();
      interest_id = b.interest_id || b.interestId;
      email = b.email;
    } else {
      const form = await request.formData();
      interest_id = form.get("interest_id");
      email = form.get("email");
      const redir = form.get("redirect") || "/my-interests";
      db.prepare("DELETE FROM student_interests WHERE id=? AND email=?").run(interest_id, email);
      return redirect(redir);
    }
    if (!interest_id || !email) return json({ error: "Missing required fields" }, 400);
    db.prepare("DELETE FROM student_interests WHERE id=? AND email=?").run(interest_id, email);
    return json({ success: true });
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  if (path === "/login" && method === "GET")
    return html(pageLogin());

  if (path === "/login" && method === "POST") {
    const form = await request.formData();
    const username = form.get("username") || "";
    const password = form.get("password") || "";
    const dbUser = db.prepare("SELECT id, username, role FROM users WHERE username=? AND password=? AND is_active=1").get(username, password);
    if (!dbUser) return html(pageLogin("Invalid username or password"));
    const sessionUser = { id: dbUser.id, username: dbUser.username, role: dbUser.role };
    const resp = redirect(dbUser.role === "admin" ? "/admin/dashboard" : "/admin/staff-portal");
    setSession(resp, sessionUser);
    return resp;
  }

  if (path === "/logout" && method === "GET") {
    const resp = redirect("/");
    clearSession(request, resp);
    return resp;
  }

  // ── Admin: guard ──────────────────────────────────────────────────────────
  const isAdmin = user?.role === "admin";
  const isStaff = isAdmin || user?.role === "staff";

  // Staff portal
  if (path === "/admin/staff-portal" && method === "GET") {
    if (!isStaff) return redirect("/login");
    return html(pageStaffPortal(user));
  }

  // Dashboard (redirect to admin or staff)
  if (path === "/admin/dashboard" && method === "GET") {
    if (!isAdmin) {
      if (isStaff) return redirect("/admin/staff-portal");
      return redirect("/login");
    }
    return html(pageAdminDashboard(user));
  }

  // Legacy redirect
  if (path === "/admin" && method === "GET") {
    if (!isAdmin) {
      if (isStaff) return redirect("/admin/staff-portal");
      return redirect("/login");
    }
    return redirect("/admin/dashboard");
  }

  // All remaining /admin/* require admin
  if (path.startsWith("/admin") && !isAdmin)
    return redirect(user ? "/" : "/login");

  // Programmes list
  if (path === "/admin/programmes" && method === "GET")
    return html(pageAdminProgrammes(user));

  // New programme form
  if (path === "/admin/programmes/new" && method === "GET")
    return html(pageProgrammeForm(user));

  // Create programme
  if (path === "/admin/programmes/new" && method === "POST") {
    const form = await request.formData();
    const title = sanitize(form.get("title") || "");
    const description = sanitize(form.get("description") || "");
    const level = form.get("level") || "";
    if (!title || title.length < 3) return html(pageProgrammeForm(user, null, "Title must be at least 3 characters"));
    if (!description || description.length < 20) return html(pageProgrammeForm(user, null, "Description must be at least 20 characters"));
    if (!["Undergraduate", "Postgraduate"].includes(level)) return html(pageProgrammeForm(user, null, "Please select a valid level"));

    let slug = slugify(title);
    let existing = db.prepare("SELECT id FROM programmes WHERE slug=?").get(slug);
    if (existing) slug = slug + "-" + Date.now();

    db.prepare("INSERT INTO programmes (title,slug,description,level,duration,credits,image_url,published,created_by) VALUES (?,?,?,?,?,?,?,?,?)")
      .run(title, slug, description, level,
        sanitize(form.get("duration") || ""),
        parseInt(form.get("credits") || 360) || 360,
        sanitize(form.get("image_url") || ""),
        form.get("published") === "1" ? 1 : 0,
        user.id);
    return redirect("/admin/programmes");
  }

  // Edit programme form
  if (path.match(/^\/admin\/programmes\/\d+\/edit$/) && method === "GET") {
    const id = parseInt(path.split("/")[3]);
    const prog = db.prepare("SELECT * FROM programmes WHERE id=?").get(id);
    if (!prog) return redirect("/admin/programmes");
    return html(pageProgrammeForm(user, prog));
  }

  // Update programme
  if (path.match(/^\/admin\/programmes\/\d+\/edit$/) && method === "POST") {
    const id = parseInt(path.split("/")[3]);
    const form = await request.formData();
    const title = sanitize(form.get("title") || "");
    const description = sanitize(form.get("description") || "");
    const level = form.get("level") || "";
    if (!title || title.length < 3) {
      const prog = db.prepare("SELECT * FROM programmes WHERE id=?").get(id);
      return html(pageProgrammeForm(user, prog, "Title must be at least 3 characters"));
    }
    db.prepare("UPDATE programmes SET title=?,description=?,level=?,duration=?,credits=?,image_url=?,published=?,updated_at=CURRENT_TIMESTAMP WHERE id=?")
      .run(title, description, level,
        sanitize(form.get("duration") || ""),
        parseInt(form.get("credits") || 360) || 360,
        sanitize(form.get("image_url") || ""),
        form.get("published") === "1" ? 1 : 0, id);
    return redirect("/admin/programmes");
  }

  // Delete programme
  if (path.match(/^\/admin\/programmes\/\d+\/delete$/) && method === "POST") {
    const id = parseInt(path.split("/")[3]);
    db.prepare("DELETE FROM programme_modules WHERE programme_id=?").run(id);
    db.prepare("DELETE FROM student_interests WHERE programme_id=?").run(id);
    db.prepare("DELETE FROM programmes WHERE id=?").run(id);
    return redirect("/admin/programmes");
  }

  // Toggle publish
  if (path.match(/^\/admin\/programmes\/\d+\/toggle$/) && method === "POST") {
    const id = parseInt(path.split("/")[3]);
    db.prepare("UPDATE programmes SET published=CASE WHEN published=1 THEN 0 ELSE 1 END WHERE id=?").run(id);
    return redirect("/admin/programmes");
  }

  // Programme modules page
  if (path.match(/^\/admin\/programmes\/\d+\/modules$/) && method === "GET") {
    const id = parseInt(path.split("/")[3]);
    const prog = db.prepare("SELECT * FROM programmes WHERE id=?").get(id);
    if (!prog) return redirect("/admin/programmes");
    const assigned = db.prepare(`SELECT m.*,pm.is_mandatory FROM modules m JOIN programme_modules pm ON m.id=pm.module_id WHERE pm.programme_id=? ORDER BY m.year,m.code`).all(id);
    const allModules = db.prepare("SELECT * FROM modules ORDER BY year,code").all();
    return html(pageAdminProgrammeModules(user, prog, allModules, assigned));
  }

  // Add module to programme
  if (path.match(/^\/admin\/programmes\/\d+\/modules\/add$/) && method === "POST") {
    const id = parseInt(path.split("/")[3]);
    const form = await request.formData();
    const moduleId = parseInt(form.get("module_id") || 0);
    const isMandatory = form.get("is_mandatory") === "1" ? 1 : 0;
    if (moduleId) {
      try { db.prepare("INSERT INTO programme_modules (programme_id,module_id,is_mandatory) VALUES (?,?,?)").run(id, moduleId, isMandatory); } catch (_) {}
    }
    return redirect(`/admin/programmes/${id}/modules`);
  }

  // Remove module from programme
  if (path.match(/^\/admin\/programmes\/\d+\/modules\/remove$/) && method === "POST") {
    const id = parseInt(path.split("/")[3]);
    const form = await request.formData();
    db.prepare("DELETE FROM programme_modules WHERE programme_id=? AND module_id=?").run(id, parseInt(form.get("module_id") || 0));
    return redirect(`/admin/programmes/${id}/modules`);
  }

  // Modules list
  if (path === "/admin/modules" && method === "GET")
    return html(pageAdminModules(user));

  // New module form
  if (path === "/admin/modules/new" && method === "GET")
    return html(pageModuleForm(user));

  // Create module
  if (path === "/admin/modules/new" && method === "POST") {
    const form = await request.formData();
    const code = sanitize(form.get("code") || "").toUpperCase();
    const title = sanitize(form.get("title") || "");
    if (!code || code.length < 3) return html(pageModuleForm(user, null, "Module code must be at least 3 characters"));
    if (!title || title.length < 3) return html(pageModuleForm(user, null, "Title must be at least 3 characters"));
    
    const module_leader_id = parseInt(form.get("module_leader_id") || 0) || null;
    
    try {
      db.prepare("INSERT INTO modules (code,title,description,year,semester,credits,module_leader_id,image_url) VALUES (?,?,?,?,?,?,?,?)")
        .run(code, title, sanitize(form.get("description") || ""),
          parseInt(form.get("year") || 0) || null,
          parseInt(form.get("semester") || 0) || null,
          parseInt(form.get("credits") || 15) || 15,
          module_leader_id,
          sanitize(form.get("image_url") || ""));
    } catch (e) {
      return html(pageModuleForm(user, null, `Could not create module: ${e.message}`));
    }
    return redirect("/admin/modules");
  }

  // Edit module form
  if (path.match(/^\/admin\/modules\/\d+\/edit$/) && method === "GET") {
    const id = parseInt(path.split("/")[3]);
    const mod = db.prepare("SELECT * FROM modules WHERE id=?").get(id);
    if (!mod) return redirect("/admin/modules");
    return html(pageModuleForm(user, mod));
  }

  // Update module
  if (path.match(/^\/admin\/modules\/\d+\/edit$/) && method === "POST") {
    const id = parseInt(path.split("/")[3]);
    const form = await request.formData();
    const code = sanitize(form.get("code") || "").toUpperCase();
    const title = sanitize(form.get("title") || "");
    if (!code || !title) return html(pageModuleForm(user, db.prepare("SELECT * FROM modules WHERE id=?").get(id), "Code and title are required"));
    
    const module_leader_id = parseInt(form.get("module_leader_id") || 0) || null;
    
    try {
      db.prepare("UPDATE modules SET code=?,title=?,description=?,year=?,semester=?,credits=?,module_leader_id=?,image_url=?,updated_at=CURRENT_TIMESTAMP WHERE id=?")
        .run(code, title,
          sanitize(form.get("description") || ""),
          parseInt(form.get("year") || 0) || null,
          parseInt(form.get("semester") || 0) || null,
          parseInt(form.get("credits") || 15) || 15,
          module_leader_id,
          sanitize(form.get("image_url") || ""), id);
    } catch (e) {
      return html(pageModuleForm(user, db.prepare("SELECT * FROM modules WHERE id=?").get(id), `Update failed: ${e.message}`));
    }
    return redirect("/admin/modules");
  }

  // Delete module
  if (path.match(/^\/admin\/modules\/\d+\/delete$/) && method === "POST") {
    const id = parseInt(path.split("/")[3]);
    db.prepare("DELETE FROM programme_modules WHERE module_id=?").run(id);
    db.prepare("DELETE FROM modules WHERE id=?").run(id);
    return redirect("/admin/modules");
  }

  // Interests list
  if (path === "/admin/interests" && method === "GET") {
    const progId = url.searchParams.get("programme_id") || "";
    let sql = `SELECT si.*, p.title as programme_title FROM student_interests si JOIN programmes p ON si.programme_id=p.id`;
    const params = [];
    if (progId) { sql += " WHERE si.programme_id=?"; params.push(parseInt(progId)); }
    sql += " ORDER BY si.created_at DESC";
    const interests = db.prepare(sql).all(...params);
    const programmes = db.prepare("SELECT id, title FROM programmes ORDER BY title").all();
    return html(pageAdminInterests(user, interests, programmes, progId));
  }

  // Update interest status
  if (path.match(/^\/admin\/interests\/\d+\/status$/) && method === "POST") {
    const id = parseInt(path.split("/")[3]);
    const form = await request.formData();
    const status = form.get("status") || "pending";
    if (["pending", "contacted", "converted"].includes(status))
      db.prepare("UPDATE student_interests SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(status, id);
    const ref = request.headers.get("referer") || "/admin/interests";
    return redirect(ref);
  }

  // Delete interest
  if (path.match(/^\/admin\/interests\/\d+\/delete$/) && method === "POST") {
    const id = parseInt(path.split("/")[3]);
    db.prepare("DELETE FROM student_interests WHERE id=?").run(id);
    const ref = request.headers.get("referer") || "/admin/interests";
    return redirect(ref);
  }

  // Export CSV
  if (path === "/admin/interests/export" && method === "GET") {
    const progId = url.searchParams.get("programme_id") || "";
    let sql = `SELECT si.name, si.email, si.phone, p.title as programme_title, p.level, si.status, si.created_at, si.message FROM student_interests si JOIN programmes p ON si.programme_id=p.id`;
    const params = [];
    if (progId) { sql += " WHERE si.programme_id=?"; params.push(parseInt(progId)); }
    sql += " ORDER BY p.title, si.created_at";
    const rows = db.prepare(sql).all(...params);
    const header = "Name,Email,Phone,Programme,Level,Status,Registered,Message\n";
    const csvRows = rows.map(r => [r.name, r.email, r.phone || "", r.programme_title, r.level, r.status, r.created_at, r.message || ""]
      .map(cell => `"${String(cell || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const filename = progId ? `interests-programme-${progId}.csv` : "interests-all.csv";
    return new Response(header + csvRows, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });
  }

  // Staff management
  if (path === "/admin/staff" && method === "GET")
    return html(pageAdminStaff(user));

  if (path === "/admin/staff/new" && method === "GET")
    return html(pageAddStaff(user));

  if (path === "/admin/staff/new" && method === "POST") {
    const form = await request.formData();
    const username = sanitize(form.get("username") || "");
    const email = sanitize(form.get("email") || "");
    const password = form.get("password") || "";
    const role = ["staff", "admin"].includes(form.get("role")) ? form.get("role") : "staff";
    if (!username || !password) return html(pageAddStaff(user, "Username and password are required"));
    try {
      db.prepare("INSERT INTO users (username,password,email,role) VALUES (?,?,?,?)").run(username, password, email, role);
    } catch (e) {
      return html(pageAddStaff(user, `Could not add staff: username may already exist`));
    }
    return redirect("/admin/staff");
  }

  if (path.match(/^\/admin\/staff\/\d+\/delete$/) && method === "POST") {
    const id = parseInt(path.split("/")[3]);
    // Unassign modules first
    db.prepare("UPDATE modules SET module_leader_id = NULL WHERE module_leader_id = ?").run(id);
    db.prepare("DELETE FROM staff_programmes WHERE staff_id = ?").run(id);
    db.prepare("DELETE FROM users WHERE id=? AND role='staff'").run(id);
    return redirect("/admin/staff");
  }

  // ── 404 ───────────────────────────────────────────────────────────────────
  return html(layout(`
    <div class="container" style="text-align:center;padding:5rem 1rem">
      <h1 style="font-size:5rem;color:var(--gray-200)">404</h1>
      <h2>Page Not Found</h2>
      <p style="color:var(--gray-500);margin:1rem 0">The page you're looking for doesn't exist.</p>
      <a href="/" class="btn btn-primary">Go Home</a>
    </div>
  `, "404", user), 404);
}

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = 8000;
console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                    🎓 Student Course Hub — Ready                   ║
╠══════════════════════════════════════════════════════════════════╣
║  http://localhost:${PORT}                                             ║
║                                                                    ║
║  Demo Accounts:                                                    ║
║    admin     / admin123      (Full Admin Access)                   ║
║    sjohnson  / staff123      (Staff Portal - Module Leader)        ║
║    mchen     / staff123      (Staff Portal)                        ║
║    ebrown    / staff123      (Staff Portal)                        ║
║    student1  / student123    (Student View)                        ║
║                                                                    ║
║  Student Routes:                                                   ║
║    /                         Home                                  ║
║    /programmes               Browse all programmes                 ║
║    /programmes/:id           Programme details                     ║
║    /my-interests             Manage your registrations             ║
║                                                                    ║
║  Admin Routes (admin only):                                        ║
║    /admin/dashboard          Dashboard                             ║
║    /admin/programmes         Manage programmes                     ║
║    /admin/modules            Manage modules                        ║
║    /admin/interests          Mailing list + CSV export             ║
║    /admin/staff              Staff management                      ║
║                                                                    ║
║  Staff Routes:                                                     ║
║    /admin/staff-portal       View assigned modules                 ║
╚══════════════════════════════════════════════════════════════════╝
`);

serve(handleRequest, { port: PORT });