// utils/sanitize.js - Input sanitization utilities
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  // Remove any HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Remove any script tags and event handlers
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  
  // Escape special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  
  return sanitized;
}

export function sanitizeObject(obj) {
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export function sanitizeEmail(email) {
  if (!email) return '';
  // Remove any potentially harmful characters
  return email.replace(/[<>\"\'\(\)]/g, '').trim();
}

export function sanitizeUrl(url) {
  if (!url) return '';
  // Only allow http/https URLs
  if (url.match(/^(http|https):\/\//)) {
    return url.replace(/[<>\"\'\(\)]/g, '');
  }
  return '';
}