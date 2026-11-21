// models/User.js
import { getDb } from "../config/database.js";
import { hashPassword, verifyPassword } from "../tools/hash.js";
import { validateEmail, validateUsername } from "../tools/validators.js";

export class User {
  static db = getDb();
  
  static findByUsername(username) {
    return this.db.prepare(`
      SELECT id, username, email, role, is_active, created_at
      FROM users WHERE username = ?
    `).get(username);
  }
  
  static findByEmail(email) {
    if (!email) return null;
    return this.db.prepare(`
      SELECT id, username, email, role, is_active, created_at
      FROM users WHERE email = ?
    `).get(email);
  }
  
  static async authenticate(username, password) {
    const user = this.db.prepare(`
      SELECT id, username, role, email, password
      FROM users 
      WHERE username = ? AND is_active = 1
    `).get(username);
    
    if (!user) return null;
    
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) return null;
    
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  
  static getById(id) {
    return this.db.prepare(`
      SELECT id, username, email, role, created_at
      FROM users WHERE id = ?
    `).get(id);
  }
  
  static getAllStaff() {
    return this.db.prepare(`
      SELECT u.id, u.username, u.email, u.role, u.created_at, 
             COUNT(m.id) as module_count
      FROM users u
      LEFT JOIN modules m ON u.id = m.module_leader_id
      WHERE u.role IN ('admin', 'staff')
      GROUP BY u.id
      ORDER BY u.role, u.username
    `).all();
  }
  
  static async createStaff(username, password, email, role = 'staff') {
    // Validate inputs
    if (!username || !validateUsername(username)) {
      throw new Error("Invalid username. Must be 3-50 characters and contain only letters, numbers, dots, and underscores");
    }
    
    if (!password || password.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }
    
    if (email && !validateEmail(email)) {
      throw new Error("Invalid email address");
    }
    
    // Check if username exists
    const existingUser = this.findByUsername(username);
    if (existingUser) {
      throw new Error("Username already exists");
    }
    
    // Check if email exists
    if (email) {
      const existingEmail = this.findByEmail(email);
      if (existingEmail) {
        throw new Error("Email already exists");
      }
    }
    
    const hashedPassword = await hashPassword(password);
    
    const stmt = this.db.prepare(`
      INSERT INTO users (username, password, email, role)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(username, hashedPassword, email || null, role);
    return { id: result.lastInsertId };
  }
  
  static async updatePassword(userId, newPassword) {
    if (!newPassword || newPassword.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }
    
    const hashedPassword = await hashPassword(newPassword);
    return this.db.prepare(`
      UPDATE users 
      SET password = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(hashedPassword, userId);
  }
  
  static deleteStaff(id) {
    this.db.prepare("UPDATE modules SET module_leader_id = NULL WHERE module_leader_id = ?").run(id);
    this.db.prepare("DELETE FROM staff_programmes WHERE staff_id = ?").run(id);
    return this.db.prepare("DELETE FROM users WHERE id = ? AND role = 'staff'").run(id);
  }
  
  static getUserWithHash(username) {
    return this.db.prepare(`
      SELECT id, username, role, email, password, is_active
      FROM users WHERE username = ?
    `).get(username);
  }
  
  static async createAdmin(username, password, email) {
    const hashedPassword = await hashPassword(password);
    return this.db.prepare(`
      INSERT OR IGNORE INTO users (username, password, email, role, is_active)
      VALUES (?, ?, ?, 'admin', 1)
    `).run(username, hashedPassword, email);
  }
}