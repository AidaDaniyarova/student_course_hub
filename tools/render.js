// tools/render.js - Enhanced with academic titles

export function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Convert email/username to proper name (michael.chen -> Michael Chen)
export function formatNameFromEmail(email) {
  if (!email) return null;
  
  // Extract username from email
  let username = email.split('@')[0];
  
  // Handle different formats
  if (username.includes('.') || username.includes('_') || username.includes('-')) {
    const parts = username.split(/[._-]/);
    return parts.map(part => 
      part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    ).join(' ');
  } else if (username.length > 2) {
    // Handle "mchen" -> "M Chen"
    const firstChar = username.charAt(0).toUpperCase();
    const rest = username.slice(1);
    if (rest.length >= 2) {
      return `${firstChar} ${rest.charAt(0).toUpperCase()}${rest.slice(1).toLowerCase()}`;
    }
    return username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
  }
  
  return username;
}

// Staff directory with full names and academic titles
const staffDirectory = {
  'sjohnson': { fullName: 'Sarah Johnson', title: 'Dr.', academicTitle: 'Senior Lecturer' },
  'mchen': { fullName: 'Michael Chen', title: 'Prof.', academicTitle: 'Professor of Computer Science' },
  'ebrown': { fullName: 'Emily Brown', title: 'Dr.', academicTitle: 'Lecturer' },
  'rjones': { fullName: 'Robert Jones', title: 'Dr.', academicTitle: 'Associate Professor' },
  'admin': { fullName: 'Administrator', title: '', academicTitle: 'System Admin' }
};

// Get staff full name with optional title
export function getStaffFullName(username, email = null, includeTitle = true) {
  if (!username) return null;
  
  // Check directory first
  if (staffDirectory[username]) {
    const staff = staffDirectory[username];
    if (includeTitle && staff.title) {
      return `${staff.title} ${staff.fullName}`;
    }
    return staff.fullName;
  }
  
  // Try from email
  if (email) {
    const emailPrefix = email.split('@')[0];
    if (staffDirectory[emailPrefix]) {
      const staff = staffDirectory[emailPrefix];
      if (includeTitle && staff.title) {
        return `${staff.title} ${staff.fullName}`;
      }
      return staff.fullName;
    }
    return formatNameFromEmail(email);
  }
  
  // Format from username
  return formatNameFromEmail(username);
}

// Get academic title for staff
export function getAcademicTitle(username, email = null) {
  if (staffDirectory[username]) {
    return staffDirectory[username].academicTitle;
  }
  if (email) {
    const emailPrefix = email.split('@')[0];
    if (staffDirectory[emailPrefix]) {
      return staffDirectory[emailPrefix].academicTitle;
    }
  }
  return null;
}

// Simplified version for direct use
export function getFullName(username, email = null) {
  return getStaffFullName(username, email, false);
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

export function formatDateTime(date) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function slugify(str) {
  if (!str) return "";
  return String(str)
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .replace(/^-|-$/g, "");
}

export function sanitize(str) {
  if (!str) return "";
  return escapeHtml(str.trim());
}