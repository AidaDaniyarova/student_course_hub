// models/programme.js - Programme model (UPDATED)
import { db } from "../server.js";

export class Programme {
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
    
    try {
      return db.prepare(sql).all(...params);
    } catch (error) {
      console.error("Error in getAll:", error);
      return [];
    }
  }
  
  static getById(id) {
    try {
      return db.prepare("SELECT * FROM programmes WHERE id = ?").get(id);
    } catch (error) {
      console.error("Error in getById:", error);
      return null;
    }
  }
  
  static getBySlug(slug) {
    try {
      // First try to get by slug
      const programme = db.prepare("SELECT * FROM programmes WHERE slug = ?").get(slug);
      if (programme) return programme;
      
      // If no slug found, try to get by id (if slug is actually a number)
      if (!isNaN(parseInt(slug))) {
        return this.getById(parseInt(slug));
      }
      
      return null;
    } catch (error) {
      console.error("Error in getBySlug:", error);
      // Fallback: try to get by ID if slug column doesn't exist
      if (!isNaN(parseInt(slug))) {
        return this.getById(parseInt(slug));
      }
      return null;
    }
  }
  
  static getModules(programmeId) {
    try {
      return db.prepare(`
        SELECT m.*, pm.is_mandatory 
        FROM modules m
        JOIN programme_modules pm ON m.id = pm.module_id
        WHERE pm.programme_id = ?
        ORDER BY m.year, m.semester, m.code
      `).all(programmeId);
    } catch (error) {
      console.error("Error in getModules:", error);
      return [];
    }
  }
  
  static getModulesByYear(programmeId) {
    const modules = this.getModules(programmeId);
    const byYear = {};
    
    for (const module of modules) {
      const year = module.year || 1;
      if (!byYear[year]) {
        byYear[year] = [];
      }
      byYear[year].push(module);
    }
    
    return byYear;
  }
  
  static getInterestedStudents(programmeId) {
    try {
      return db.prepare(`
        SELECT si.*, 
               CASE 
                 WHEN si.created_at > datetime('now', '-7 days') THEN 'new'
                 ELSE 'old'
               END as status
        FROM student_interests si
        WHERE si.programme_id = ?
        ORDER BY si.created_at DESC
      `).all(programmeId);
    } catch (error) {
      console.error("Error in getInterestedStudents:", error);
      return [];
    }
  }
  
  static getInterestCount(programmeId) {
    try {
      const result = db.prepare(`
        SELECT COUNT(*) as count 
        FROM student_interests 
        WHERE programme_id = ?
      `).get(programmeId);
      return result ? result.count : 0;
    } catch (error) {
      console.error("Error in getInterestCount:", error);
      return 0;
    }
  }
  
  static getStaff(programmeId) {
    try {
      return db.prepare(`
        SELECT u.*, sp.role
        FROM users u
        JOIN staff_programmes sp ON u.id = sp.staff_id
        WHERE sp.programme_id = ?
      `).all(programmeId);
    } catch (error) {
      console.error("Error in getStaff:", error);
      return [];
    }
  }
  
  static create(data) {
    try {
      const stmt = db.prepare(`
        INSERT INTO programmes (title, slug, description, level, duration, credits, image_url, published, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(
        data.title, data.slug, data.description, data.level,
        data.duration, data.credits, data.image_url, data.published || 0,
        data.created_by
      );
      return { id: result.lastInsertId };
    } catch (error) {
      console.error("Error in create:", error);
      return null;
    }
  }
  
  static update(id, data) {
    try {
      const stmt = db.prepare(`
        UPDATE programmes 
        SET title = ?, slug = ?, description = ?, level = ?, 
            duration = ?, credits = ?, image_url = ?, published = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      return stmt.run(
        data.title, data.slug, data.description, data.level,
        data.duration, data.credits, data.image_url, data.published, id
      );
    } catch (error) {
      console.error("Error in update:", error);
      return null;
    }
  }
  
  static delete(id) {
    try {
      return db.prepare("DELETE FROM programmes WHERE id = ?").run(id);
    } catch (error) {
      console.error("Error in delete:", error);
      return null;
    }
  }
  
  static togglePublish(id) {
    const programme = this.getById(id);
    if (!programme) return null;
    return this.update(id, { ...programme, published: programme.published ? 0 : 1 });
  }
  
  static addModule(programmeId, moduleId, isMandatory = 1) {
    try {
      return db.prepare(`
        INSERT INTO programme_modules (programme_id, module_id, is_mandatory)
        VALUES (?, ?, ?)
      `).run(programmeId, moduleId, isMandatory);
    } catch (error) {
      console.error("Error in addModule:", error);
      return null;
    }
  }
  
  static removeModule(programmeId, moduleId) {
    try {
      return db.prepare(`
        DELETE FROM programme_modules 
        WHERE programme_id = ? AND module_id = ?
      `).run(programmeId, moduleId);
    } catch (error) {
      console.error("Error in removeModule:", error);
      return null;
    }
  }
  
  static getRelatedProgrammes(programmeId, limit = 3) {
    try {
      const programme = this.getById(programmeId);
      if (!programme) return [];
      
      return db.prepare(`
        SELECT * FROM programmes 
        WHERE level = ? AND id != ? AND published = 1
        ORDER BY created_at DESC
        LIMIT ?
      `).all(programme.level, programmeId, limit);
    } catch (error) {
      console.error("Error in getRelatedProgrammes:", error);
      return [];
    }
  }
}

export default Programme;