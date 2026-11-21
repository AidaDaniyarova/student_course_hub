// tools/hash.js
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const SALT_ROUNDS = 10;

export async function hashPassword(password) {
  if (!password) throw new Error("Password is required");
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const hashed = await bcrypt.hash(password, salt);
  return hashed;
}

export async function verifyPassword(password, hash) {
  if (!password || !hash) return false;
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error("Password verification error:", error);
    return false;
  }
}

export function generateSecurePassword(length = 12) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export function isStrongPassword(password) {
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

export function getPasswordStrength(password) {
  if (!password) return { score: 0, message: "No password", color: "gray" };
  
  let score = 0;
  const checks = [];
  
  if (password.length >= 8) {
    score++;
    checks.push("✓ Length OK");
  } else {
    checks.push("❌ At least 8 characters");
  }
  
  if (/[A-Z]/.test(password)) {
    score++;
    checks.push("✓ Uppercase");
  } else {
    checks.push("❌ Uppercase letter");
  }
  
  if (/[a-z]/.test(password)) {
    score++;
    checks.push("✓ Lowercase");
  } else {
    checks.push("❌ Lowercase letter");
  }
  
  if (/[0-9]/.test(password)) {
    score++;
    checks.push("✓ Number");
  } else {
    checks.push("❌ Number");
  }
  
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score++;
    checks.push("✓ Special character");
  } else {
    checks.push("❌ Special character");
  }
  
  let message = "";
  let color = "";
  
  if (score === 5) {
    message = "Strong password ✓";
    color = "green";
  } else if (score >= 3) {
    message = `Medium password - ${checks.filter(c => c.includes('❌')).join(', ')}`;
    color = "orange";
  } else {
    message = `Weak password - ${checks.filter(c => c.includes('❌')).join(', ')}`;
    color = "red";
  }
  
  return { score, message, color };
}