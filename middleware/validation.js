// middleware/validation.js
import { sanitizeObject } from "../tools/sanitize.js";

export function validateBody(schema) {
  return async (request) => {
    try {
      const body = await request.json();
      const sanitized = sanitizeObject(body);
      const errors = [];
      
      for (const [field, rules] of Object.entries(schema)) {
        const value = sanitized[field];
        
        if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
          errors.push(`${field} is required`);
        }
        
        if (rules.type && value) {
          if (rules.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            errors.push(`${field} must be a valid email`);
          }
          if (rules.type === 'number' && isNaN(value)) {
            errors.push(`${field} must be a number`);
          }
          if (rules.type === 'url' && !/^https?:\/\//.test(value)) {
            errors.push(`${field} must be a valid URL`);
          }
        }
        
        if (rules.minLength && value && value.length < rules.minLength) {
          errors.push(`${field} must be at least ${rules.minLength} characters`);
        }
        
        if (rules.maxLength && value && value.length > rules.maxLength) {
          errors.push(`${field} must be less than ${rules.maxLength} characters`);
        }
        
        if (rules.pattern && value && !rules.pattern.test(value)) {
          errors.push(`${field} has invalid format`);
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

export function validateForm(schema) {
  return async (request) => {
    const formData = await request.formData();
    const data = {};
    const errors = [];
    
    for (const [key, value] of formData.entries()) {
      data[key] = typeof value === 'string' ? value.trim() : value;
    }
    
    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      
      if (rules.required && (!value || value === '')) {
        errors.push({ field, message: `${field} is required` });
      }
      
      if (rules.minLength && value && value.length < rules.minLength) {
        errors.push({ field, message: `${field} must be at least ${rules.minLength} characters` });
      }
      
      if (rules.maxLength && value && value.length > rules.maxLength) {
        errors.push({ field, message: `${field} must be less than ${rules.maxLength} characters` });
      }
    }
    
    return { valid: errors.length === 0, errors, data };
  };
}