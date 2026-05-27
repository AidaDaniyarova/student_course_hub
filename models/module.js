// models/Module.js
import { getDb } from "../config/database.js";

export class Module {
  static db = getDb();
  
  static getAll() {
    return this.db.prepare(`
      SELECT m.*, u.username as leader_name,
        (SELECT COUNT(*) FROM programme_modules WHERE module_id = m.id) as programme_count
      FROM modules m
      LEFT JOIN users u ON m.module_leader_id = u.id
      ORDER BY m.year, m.semester, m.code
    `).all();
  }
  
  static getById(id) {
    return this.db.prepare(`
      SELECT m.*, u.username as leader_name
      FROM modules m
      LEFT JOIN users u ON m.module_leader_id = u.id
      WHERE m.id = ?
    `).get(id);
  }
  
  static getByLeader(staffId) {
    return this.db.prepare(`
      SELECT m.*, COUNT(pm.programme_id) as programme_count
      FROM modules m
      LEFT JOIN programme_modules pm ON m.id = pm.module_id
      WHERE m.module_leader_id = ?
      GROUP BY m.id
      ORDER BY m.year, m.code
    `).all(staffId);
  }
  
  static create(data) {
    const stmt = this.db.prepare(`
      INSERT INTO modules (code, title, description, year, semester, credits, module_leader_id, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.code, data.title, data.description,
      data.year || null, data.semester || null,
      data.credits || 15, data.module_leader_id || null,
      data.image_url || null
    );
    return { id: result.lastInsertId };
  }
  
  static update(id, data) {
    const stmt = this.db.prepare(`
      UPDATE modules 
      SET code = ?, title = ?, description = ?, year = ?, semester = ?,
          credits = ?, module_leader_id = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(
      data.code, data.title, data.description,
      data.year || null, data.semester || null,
      data.credits || 15, data.module_leader_id || null,
      data.image_url || null, id
    );
  }
  
  static delete(id) {
    this.db.prepare("DELETE FROM programme_modules WHERE module_id = ?").run(id);
    return this.db.prepare("DELETE FROM modules WHERE id = ?").run(id);
  }
  
  static getStats() {
    return this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(credits) as total_credits,
        COUNT(DISTINCT module_leader_id) as leaders,
        AVG(credits) as avg_credits
      FROM modules
    `).get();
  }
  
  static getAllStaff() {
    return this.db.prepare(`
      SELECT id, username, email FROM users 
      WHERE role IN ('admin', 'staff') 
      ORDER BY username
    `).all();
  }
}