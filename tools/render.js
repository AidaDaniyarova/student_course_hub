// tools/render.js - Template rendering helpers
export function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/`/g, "&#96;");
}

export function truncate(str, length = 100) {
  if (!str) return "";
  if (str.length <= length) return str;
  return str.substring(0, length) + "...";
}

export function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

export function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .trim();
}

export function generateBreadcrumbs(path, programmeTitle = null) {
  const paths = path.split("/").filter(p => p);
  const breadcrumbs = [{ name: "Home", url: "/" }];
  
  let currentPath = "";
  for (const p of paths) {
    currentPath += "/" + p;
    let name = p.charAt(0).toUpperCase() + p.slice(1);
    if (p === "programmes" && programmeTitle) {
      name = programmeTitle;
    }
    breadcrumbs.push({ name, url: currentPath });
  }
  
  return breadcrumbs;
}