// models/module.js - Module model
import { db } from "../server.js";

export class Module {
  static getAll() {
    return db.prepare(`
      SELECT m.*, 
             COUNT(DISTINCT pm.programme_id) as programme_count
      FROM modules m
      LEFT JOIN programme_modules pm ON m.id = pm.module_id
      GROUP BY m.id
      ORDER BY m.year, m.semester, m.code
    `).all();
  }
  
  static getById(id) {
    return db.prepare(`
      SELECT m.*, 
             COUNT(DISTINCT pm.programme_id) as programme_count
      FROM modules m
      LEFT JOIN programme_modules pm ON m.id = pm.module_id
      WHERE m.id = ?
      GROUP BY m.id
    `).get(id);
  }
  
  static getByCode(code) {
    return db.prepare("SELECT * FROM modules WHERE code = ?").get(code);
  }
  
  static getProgrammes(moduleId) {
    return db.prepare(`
      SELECT p.*, pm.is_mandatory
      FROM programmes p
      JOIN programme_modules pm ON p.id = pm.programme_id
      WHERE pm.module_id = ?
      ORDER BY p.level, p.title
    `).all(moduleId);
  }
  
  static getByYear(year) {
    return db.prepare(`
      SELECT * FROM modules 
      WHERE year = ? 
      ORDER BY semester, code
    `).all(year);
  }
  
  static getByLeader(leaderId) {
    return db.prepare(`
      SELECT * FROM modules 
      WHERE module_leader_id = ? 
      ORDER BY year, code
    `).all(leaderId);
  }
  
  static getSharedModules() {
    return db.prepare(`
      SELECT m.*, COUNT(pm.programme_id) as shared_count
      FROM modules m
      JOIN programme_modules pm ON m.id = pm.module_id
      GROUP BY m.id
      HAVING shared_count > 1
      ORDER BY shared_count DESC
    `).all();
  }
  
  static create(data) {
    const stmt = db.prepare(`
      INSERT INTO modules (code, title, description, year, semester, credits, 
                          module_leader_id, module_leader_name, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.code, data.title, data.description, data.year, data.semester,
      data.credits, data.module_leader_id, data.module_leader_name, data.image_url
    );
    return { id: result.lastInsertId };
  }
  
  static update(id, data) {
    const stmt = db.prepare(`
      UPDATE modules 
      SET code = ?, title = ?, description = ?, year = ?, semester = ?,
          credits = ?, module_leader_id = ?, module_leader_name = ?, image_url = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(
      data.code, data.title, data.description, data.year, data.semester,
      data.credits, data.module_leader_id, data.module_leader_name, data.image_url, id
    );
  }
  
  static delete(id) {
    return db.prepare("DELETE FROM modules WHERE id = ?").run(id);
  }
  
  static search(keyword) {
    return db.prepare(`
      SELECT * FROM modules 
      WHERE code LIKE ? OR title LIKE ? OR description LIKE ?
      ORDER BY year, code
    `).all(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
}

export default Module;