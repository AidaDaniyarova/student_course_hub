// models/Programme.js
import { getDb } from "../config/database.js";

export class Programme {
  static db = getDb();
  
  static getAll(filters = {}) {
    let sql = "SELECT * FROM programmes WHERE 1=1";
    const params = [];
    
    if (filters.published !== undefined) {
      sql += " AND published = ?";
      params.push(filters.published);
    }
    if (filters.level) {
      sql += " AND level = ?";
      params.push(filters.level);
    }
    if (filters.search) {
      sql += " AND (title LIKE ? OR description LIKE ?)";
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }
    
    sql += " ORDER BY level, title";
    return this.db.prepare(sql).all(...params);
  }
  
  static getById(id) {
    return this.db.prepare("SELECT * FROM programmes WHERE id = ?").get(id);
  }
  
  static getModules(programmeId) {
    return this.db.prepare(`
      SELECT m.*, pm.is_mandatory,
        (SELECT COUNT(*) FROM programme_modules WHERE module_id = m.id) as shared_count
      FROM modules m
      JOIN programme_modules pm ON m.id = pm.module_id
      WHERE pm.programme_id = ?
      ORDER BY m.year, m.semester, m.code
    `).all(programmeId);
  }
  
  static getModulesByYear(programmeId) {
    const modules = this.getModules(programmeId);
    const byYear = {};
    for (const module of modules) {
      const year = module.year || 1;
      if (!byYear[year]) byYear[year] = [];
      byYear[year].push(module);
    }
    return byYear;
  }
  
  static getInterestCount(programmeId) {
    const result = this.db.prepare(`
      SELECT COUNT(*) as count FROM student_interests WHERE programme_id = ?
    `).get(programmeId);
    return result?.count || 0;
  }
  
  static create(data) {
    const stmt = this.db.prepare(`
      INSERT INTO programmes (title, slug, description, level, duration, credits, image_url, published, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.title, data.slug, data.description, data.level,
      data.duration, data.credits, data.image_url, data.published || 0, data.created_by
    );
    return { id: result.lastInsertId };
  }
  
  static update(id, data) {
    const stmt = this.db.prepare(`
      UPDATE programmes 
      SET title = ?, description = ?, level = ?, duration = ?, 
          credits = ?, image_url = ?, published = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(
      data.title, data.description, data.level, data.duration,
      data.credits, data.image_url, data.published, id
    );
  }
  
  static delete(id) {
    this.db.prepare("DELETE FROM programme_modules WHERE programme_id = ?").run(id);
    this.db.prepare("DELETE FROM student_interests WHERE programme_id = ?").run(id);
    return this.db.prepare("DELETE FROM programmes WHERE id = ?").run(id);
  }
  
  static togglePublish(id) {
    return this.db.prepare(`
      UPDATE programmes SET published = CASE WHEN published = 1 THEN 0 ELSE 1 END WHERE id = ?
    `).run(id);
  }
  
  static addModule(programmeId, moduleId, isMandatory = 1) {
    try {
      return this.db.prepare(`
        INSERT INTO programme_modules (programme_id, module_id, is_mandatory)
        VALUES (?, ?, ?)
      `).run(programmeId, moduleId, isMandatory);
    } catch (e) {
      return null;
    }
  }
  
  static removeModule(programmeId, moduleId) {
    return this.db.prepare(`
      DELETE FROM programme_modules WHERE programme_id = ? AND module_id = ?
    `).run(programmeId, moduleId);
  }
  
  static getAssignedModules(programmeId) {
    return this.db.prepare(`
      SELECT m.* FROM modules m
      JOIN programme_modules pm ON m.id = pm.module_id
      WHERE pm.programme_id = ?
    `).all(programmeId);
  }
  
  static getAvailableModules(programmeId) {
    return this.db.prepare(`
      SELECT * FROM modules 
      WHERE id NOT IN (SELECT module_id FROM programme_modules WHERE programme_id = ?)
      ORDER BY year, code
    `).all(programmeId);
  }
  
  static getStats() {
    return this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN published = 1 THEN 1 ELSE 0 END) as published,
        SUM(CASE WHEN level = 'Undergraduate' THEN 1 ELSE 0 END) as undergraduate,
        SUM(CASE WHEN level = 'Postgraduate' THEN 1 ELSE 0 END) as postgraduate
      FROM programmes
    `).get();
  }
}