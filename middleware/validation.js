// middleware/validation.js - Request validation middleware
import { sanitizeObject } from "../tools/sanitise.js";

export function validateBody(schema) {
  return async (request) => {
    try {
      const body = await request.json();
      const sanitized = sanitizeObject(body);
      
      const errors = [];
      for (const [field, rules] of Object.entries(schema)) {
        const value = sanitized[field];
        
        if (rules.required && !value) {
          errors.push(`${field} is required`);
        }
        
        if (rules.type && value) {
          if (rules.type === 'email' && !validateEmail(value)) {
            errors.push(`${field} must be a valid email`);
          }
          if (rules.type === 'number' && isNaN(value)) {
            errors.push(`${field} must be a number`);
          }
        }
        
        if (rules.minLength && value && value.length < rules.minLength) {
          errors.push(`${field} must be at least ${rules.minLength} characters`);
        }
        
        if (rules.maxLength && value && value.length > rules.maxLength) {
          errors.push(`${field} must be less than ${rules.maxLength} characters`);
        }
      }
      
      if (errors.length > 0) {
        return { valid: false, errors, body: null };
      }
      
      return { valid: true, errors: null, body: sanitized };
    } catch (error) {
      return { valid: false, errors: ["Invalid request body"], body: null };
    }
  };
}

function validateEmail(email) {
  return /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/.test(email);
}

export function rateLimit(requestsPerMinute = 60) {
  const requests = new Map();
  
  return async (request) => {
    const ip = await request.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    const minuteAgo = now - 60 * 1000;
    
    if (!requests.has(ip)) {
      requests.set(ip, []);
    }
    
    const userRequests = requests.get(ip).filter(timestamp => timestamp > minuteAgo);
    
    if (userRequests.length >= requestsPerMinute) {
      return { limited: true, retryAfter: 60 };
    }
    
    userRequests.push(now);
    requests.set(ip, userRequests);
    
    return { limited: false };
  };
}