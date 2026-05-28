// tools/validators.js
export function validateEmail(email) {
  if (!email) return true; // Email is optional for staff
  const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone) {
  if (!phone) return true; // Optional field
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone);
}

export function validateRequired(value) {
  if (!value) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
}

export function validateLength(value, min, max) {
  if (!value) return false;
  const length = value.toString().length;
  return length >= min && length <= max;
}

export function validateUrl(url) {
  if (!url) return true;
  return /^https?:\/\/[^\s]+$/.test(url);
}

export function validateNumber(value, min, max) {
  const num = Number(value);
  if (isNaN(num)) return false;
  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;
  return true;
}

export function validateUsername(username) {
  if (!username) return false;
  // Username: letters, numbers, underscore, dot, min 3, max 50
  const usernameRegex = /^[a-zA-Z0-9._]{3,50}$/;
  return usernameRegex.test(username);
}

export function validatePasswordStrength(password) {
  if (!password) return false;
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return password.length >= minLength && 
         hasUpperCase && 
         hasLowerCase && 
         hasNumbers && 
         hasSpecialChar;
}

export function validateLogin(data) {
  const errors = [];
  
  if (!validateRequired(data.username)) {
    errors.push("Username is required");
  }
  
  if (!validateRequired(data.password)) {
    errors.push("Password is required");
  }
  
  return { isValid: errors.length === 0, errors };
}

export function validateProgramme(data) {
  const errors = [];
  
  if (!validateRequired(data.title)) {
    errors.push("Title is required");
  } else if (!validateLength(data.title, 3, 100)) {
    errors.push("Title must be between 3 and 100 characters");
  }
  
  if (!validateRequired(data.description)) {
    errors.push("Description is required");
  } else if (!validateLength(data.description, 20, 5000)) {
    errors.push("Description must be between 20 and 5000 characters");
  }
  
  if (!validateRequired(data.level)) {
    errors.push("Level is required");
  } else if (!['Undergraduate', 'Postgraduate'].includes(data.level)) {
    errors.push("Level must be Undergraduate or Postgraduate");
  }
  
  if (data.credits && !validateNumber(data.credits, 0, 500)) {
    errors.push("Credits must be between 0 and 500");
  }
  
  if (data.image_url && !validateUrl(data.image_url)) {
    errors.push("Image URL must be a valid URL");
  }
  
  return { isValid: errors.length === 0, errors };
}

export function validateModule(data) {
  const errors = [];
  
  if (!validateRequired(data.code)) {
    errors.push("Module code is required");
  } else if (!validateLength(data.code, 3, 20)) {
    errors.push("Module code must be between 3 and 20 characters");
  }
  
  if (!validateRequired(data.title)) {
    errors.push("Title is required");
  } else if (!validateLength(data.title, 3, 200)) {
    errors.push("Title must be between 3 and 200 characters");
  }
  
  if (data.year && !validateNumber(data.year, 1, 4)) {
    errors.push("Year must be between 1 and 4");
  }
  
  if (data.semester && !validateNumber(data.semester, 1, 2)) {
    errors.push("Semester must be 1 or 2");
  }
  
  if (data.credits && !validateNumber(data.credits, 0, 60)) {
    errors.push("Credits must be between 0 and 60");
  }
  
  return { isValid: errors.length === 0, errors };
}

export function validateInterest(data) {
  const errors = [];
  
  if (!validateRequired(data.name)) {
    errors.push("Name is required");
  } else if (!validateLength(data.name, 2, 100)) {
    errors.push("Name must be between 2 and 100 characters");
  }
  
  if (!validateRequired(data.email)) {
    errors.push("Email is required");
  } else if (!validateEmail(data.email)) {
    errors.push("Please enter a valid email address");
  }
  
  if (data.phone && !validatePhone(data.phone)) {
    errors.push("Please enter a valid phone number");
  }
  
  if (!validateRequired(data.programme_id)) {
    errors.push("Programme selection is required");
  }
  
  return { isValid: errors.length === 0, errors };
}