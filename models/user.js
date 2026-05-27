// models/User.js
import { getDb } from "../config/database.js";

export class User {
  static db = getDb();
  
  static findByUsername(username) {
    return this.db.prepare(`
      SELECT id, username, email, role, is_active, created_at
      FROM users WHERE username = ?
    `).get(username);
  }
  
  static authenticate(username, password) {
    return this.db.prepare(`
      SELECT id, username, role, email 
      FROM users 
      WHERE username = ? AND password = ? AND is_active = 1
    `).get(username, password);
  }
  
  static getById(id) {
    return this.db.prepare(`
      SELECT id, username, email, role, created_at
      FROM users WHERE id = ?
    `).get(id);
  }
  
  static getAllStaff() {
    return this.db.prepare(`
      SELECT u.*, COUNT(m.id) as module_count
      FROM users u
      LEFT JOIN modules m ON u.id = m.module_leader_id
      WHERE u.role IN ('admin', 'staff')
      GROUP BY u.id
      ORDER BY u.role, u.username
    `).all();
  }
  
  static createStaff(username, password, email, role = 'staff') {
    const stmt = this.db.prepare(`
      INSERT INTO users (username, password, email, role)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(username, password, email, role);
    return { id: result.lastInsertId };
  }
  
  static deleteStaff(id) {
    // Unassign modules first
    this.db.prepare("UPDATE modules SET module_leader_id = NULL WHERE module_leader_id = ?").run(id);
    this.db.prepare("DELETE FROM staff_programmes WHERE staff_id = ?").run(id);
    return this.db.prepare("DELETE FROM users WHERE id = ? AND role = 'staff'").run(id);
  }
}